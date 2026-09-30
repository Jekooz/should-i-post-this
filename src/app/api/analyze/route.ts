import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

import { prisma, getOrCreateDefaultUser } from '@/lib/db';
import {
  analyzeWithClaude,
  generateCaptionWithClaude,
  isClaudeAvailable,
  toAIMimeType,
} from '@/lib/ai-claude';
import {
  analyzeWithOpenAI,
  generateCaptionWithOpenAI,
  isOpenAIAvailable,
} from '@/lib/ai-openai';
import { SUPPORTED_MIME_TYPES, MAX_FILE_SIZE } from '@/types/photo';
import type { ScoreBreakdown } from '@/types/analysis';

export const maxDuration = 60; // 60 seconds for image analysis

function fileUrlToPath(fileUrl: string): string | null {
  if (fileUrl.startsWith('/api/uploads/')) {
    return join(process.cwd(), 'uploads', fileUrl.replace('/api/uploads/', ''));
  }
  // Legacy rows saved before the /api/uploads fix
  if (fileUrl.startsWith('/uploads/')) {
    return join(process.cwd(), 'uploads', fileUrl.replace('/uploads/', ''));
  }
  return null;
}

/** Strip leading '#' so storage is normalized ("tag1", not "#tag1"). */
function normalizeHashtags(hashtags: unknown): string[] {
  if (!Array.isArray(hashtags)) return [];
  return hashtags
    .filter((t): t is string => typeof t === 'string')
    .map((t) => t.replace(/^#+/, '').trim())
    .filter(Boolean);
}

function normalizeEmojis(emojis: unknown): string[] {
  if (!Array.isArray(emojis)) return [];
  return emojis.filter((e): e is string => typeof e === 'string').slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getOrCreateDefaultUser();
    const requestContentType = request.headers.get('content-type') || '';

    // ─── Input resolution ───
    let fileBuffer: Buffer;
    let mimeType: string;
    let originalName: string;
    let fileSize: number;
    let existingPhotoId: string | null = null;
    let savedFilename: string | null = null;
    let analyzeType = 'full';
    let captionStyle = 'casual';

    if (requestContentType.includes('application/json')) {
      // Mode 1: JSON { photoId } — analyze an already-uploaded photo
      const body = await request.json();
      existingPhotoId = body.photoId ?? null;
      analyzeType = body.type || 'full';
      captionStyle = body.style || 'casual';

      if (!existingPhotoId) {
        return NextResponse.json(
          { success: false, error: 'photoId is required' },
          { status: 400 }
        );
      }

      const photo = await prisma.photo.findUnique({ where: { id: existingPhotoId } });
      if (!photo) {
        return NextResponse.json({ success: false, error: 'Photo not found' }, { status: 404 });
      }
      if (photo.userId !== user.id) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
      }

      if (photo.source === 'immich' && photo.immichAssetId) {
        const { getImmichConfig, immichGetBinary } = await import('@/lib/immich');
        const config = getImmichConfig(user);
        if (!config) {
          return NextResponse.json(
            { success: false, error: 'Immich is not configured for this asset' },
            { status: 400 }
          );
        }
        const { buffer } = await immichGetBinary(
          config,
          `/api/assets/${photo.immichAssetId}/thumbnail?size=preview`
        );
        fileBuffer = buffer;
      } else {
        const filePath = fileUrlToPath(photo.fileUrl);
        if (!filePath) {
          return NextResponse.json(
            { success: false, error: `Unsupported photo source: ${photo.fileUrl}` },
            { status: 400 }
          );
        }
        try {
          fileBuffer = await readFile(filePath);
        } catch {
          return NextResponse.json(
            { success: false, error: 'Stored file could not be read from disk' },
            { status: 410 }
          );
        }
      }
      mimeType = photo.mimeType || 'image/jpeg';
      originalName = photo.fileName;
      fileSize = photo.fileSize;
    } else {
      // Mode 2: multipart upload — save file, then analyze
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      analyzeType = (formData.get('type') as string) || 'full';
      captionStyle = (formData.get('style') as string) || 'casual';

      if (!file) {
        return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
      }
      if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid file type. Supported types: ${SUPPORTED_MIME_TYPES.join(', ')}`,
          },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          },
          { status: 400 }
        );
      }

      const uploadsDir = join(process.cwd(), 'uploads');
      await mkdir(uploadsDir, { recursive: true });

      const fileExtension = file.name.split('.').pop() || 'jpg';
      savedFilename = `${uuidv4()}.${fileExtension}`;
      const filePath = join(uploadsDir, savedFilename);
      fileBuffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, fileBuffer);

      mimeType = file.type;
      originalName = file.name;
      fileSize = file.size;
    }

    // ─── AI availability + mime validation ───
    const useClaude = isClaudeAvailable();
    const useOpenAI = !useClaude && isOpenAIAvailable();
    if (!useClaude && !useOpenAI) {
      return NextResponse.json(
        {
          success: false,
          error: 'No AI service available. Configure ANTHROPIC_API_KEY or OPENAI_API_KEY.',
        },
        { status: 503 }
      );
    }

    // Vision endpoints only accept jpeg/png/webp/gif — HEIC/HEIF must be rejected up front.
    const aiMime = toAIMimeType(mimeType);
    if (!aiMime) {
      return NextResponse.json(
        {
          success: false,
          error: `${mimeType} is not supported for AI analysis. Convert to JPEG/PNG/WebP first.`,
        },
        { status: 415 }
      );
    }

    // ─── Run AI ───
    const base64Image = fileBuffer.toString('base64');
    const provider = useClaude ? 'claude-vision' : 'openai-vision';
    const startedAt = Date.now();

    let analysisResult: { scores: ScoreBreakdown; rawResponse: Record<string, unknown> } | null = null;
    let captionResult: { caption: string; hashtags?: string[]; emojis?: string[] } | null = null;

    if (analyzeType === 'full' || analyzeType === 'scores-only') {
      analysisResult = useClaude
        ? await analyzeWithClaude(base64Image, aiMime)
        : await analyzeWithOpenAI(base64Image, aiMime);
    }
    if (analyzeType === 'full' || analyzeType === 'caption-only') {
      captionResult = useClaude
        ? await generateCaptionWithClaude(base64Image, captionStyle, aiMime)
        : await generateCaptionWithOpenAI(base64Image, captionStyle, aiMime);
    }
    const processingTime = (Date.now() - startedAt) / 1000;

    // ─── Persist photo ───
    const raw = analysisResult?.rawResponse;
    let photo: { id: string };
    if (existingPhotoId) {
      photo = await prisma.photo.update({
        where: { id: existingPhotoId },
        data: {
          analyzed: analyzeType !== 'caption-only',
          analyzedAt: analyzeType !== 'caption-only' ? new Date() : undefined,
          overallScore: analysisResult?.scores.overall ?? null,
          aestheticScore: analysisResult?.scores.aesthetic ?? null,
          emotionScore: analysisResult?.scores.emotion ?? null,
          socialScore: analysisResult?.scores.social ?? null,
          compositionScore: analysisResult?.scores.composition ?? null,
          category: typeof raw?.category === 'string' ? raw.category : undefined,
        },
      });
    } else {
      photo = await prisma.photo.create({
        data: {
          userId: user.id,
          fileName: originalName,
          fileSize,
          mimeType,
          fileUrl: `/api/uploads/${savedFilename}`,
          source: 'manual',
          analyzed: analyzeType !== 'caption-only',
          analyzedAt: analyzeType !== 'caption-only' ? new Date() : null,
          overallScore: analysisResult?.scores.overall ?? null,
          aestheticScore: analysisResult?.scores.aesthetic ?? null,
          emotionScore: analysisResult?.scores.emotion ?? null,
          socialScore: analysisResult?.scores.social ?? null,
          compositionScore: analysisResult?.scores.composition ?? null,
          category: typeof raw?.category === 'string' ? raw.category : null,
        },
      });

      // Persist AI-extracted tags
      const tags = normalizeHashtags(raw?.tags);
      if (tags.length > 0) {
        // SQLite doesn't support skipDuplicates — dedupe by name before inserting.
        const uniqueTags = Array.from(new Set(tags));
        await prisma.photoTag.createMany({
          data: uniqueTags.map((name) => ({ photoId: photo.id, name })),
        });
      }
    }

    // ─── Persist analysis record ───
    if (analysisResult) {
      await prisma.analysis.create({
        data: {
          photoId: photo.id,
          userId: user.id,
          aiResponse: JSON.stringify(analysisResult.rawResponse),
          modelUsed: provider,
          promptUsed: 'photo_analysis',
          composition: JSON.stringify(raw?.composition ?? {}),
          emotion: JSON.stringify(raw?.emotion ?? {}),
          aesthetic: JSON.stringify(raw?.aesthetic ?? {}),
          social: JSON.stringify(raw?.social ?? {}),
          processingTime,
        },
      });
    }

    // ─── Persist caption ───
    if (captionResult) {
      const hashtags = normalizeHashtags(captionResult.hashtags);
      await prisma.caption.create({
        data: {
          photoId: photo.id,
          userId: user.id,
          style: captionStyle,
          caption: captionResult.caption,
          hashtags: JSON.stringify(hashtags),
          emojis: JSON.stringify(normalizeEmojis(captionResult.emojis)),
          charCount: captionResult.caption.length,
          isOptimal: captionStyle === 'casual',
          suggestionOrder: 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        photoId: photo.id,
        scores: analysisResult?.scores ?? null,
        caption: captionResult?.caption ?? null,
        hashtags: captionResult ? normalizeHashtags(captionResult.hashtags) : null,
        emojis: captionResult ? normalizeEmojis(captionResult.emojis) : null,
      },
      message: 'Photo analyzed successfully',
    });
  } catch (error) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';
    const status = /non-JSON/i.test(message) ? 502 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
