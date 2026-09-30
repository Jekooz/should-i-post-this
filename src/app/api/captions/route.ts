import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { getOrCreateDefaultUser } from '@/lib/db';
import { generateCaptionWithHuggingFace, isHuggingFaceAvailable } from '@/lib/ai-huggingface';
import { handleAPIError, createSuccessResponse } from '@/lib/api-client';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { photoId, style } = await request.json();

    if (!photoId) {
      return NextResponse.json(
        { success: false, error: 'Photo ID is required' },
        { status: 400 }
      );
    }

    // Get photo from database
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      return NextResponse.json(
        { success: false, error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Verify user owns the photo (simplified - in production use proper auth)
    const user = await getOrCreateDefaultUser();
    if (photo.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Generate caption using available AI service and actual image bytes
    // For local files, read from disk; for immich, fetch via the asset proxy.
    let imageBase64: string | null = null;
    const mimeType = (photo.mimeType || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

    if (photo.fileUrl?.startsWith('/api/uploads/') || photo.fileUrl?.startsWith('/uploads/') || photo.fileUrl?.startsWith('/temp/')) {
      try {
        const relative = photo.fileUrl
          .replace(/^\/api\/uploads\//, 'uploads/')
          .replace(/^\//, '');
        const filePath = join(process.cwd(), relative);
        const buf = await readFile(filePath);
        imageBase64 = buf.toString('base64');
      } catch (e) {
        console.warn('Caption: could not read local image, falling back to stub:', e);
      }
    } else if (photo.source === 'immich' && photo.immichAssetId) {
      // Fetch immich asset bytes via the internal proxy-like fetch
      const userCfg = { url: user.immichUrl || process.env.IMMICH_URL || process.env.IMMICH_BASE_URL, key: user.immichApiKey || process.env.IMMICH_API_KEY } as any;
      if (userCfg.url && userCfg.key) {
        try {
          const res = await fetch(`${userCfg.url}/api/asset/thumbnail/${photo.immichAssetId}?size=preview`, {
            headers: { 'x-api-key': userCfg.key, Accept: 'application/octet-stream' },
            signal: AbortSignal.timeout(15000),
          });
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            imageBase64 = buf.toString('base64');
          }
        } catch (e) {
          console.warn('Caption: immich thumbnail fetch failed, falling back to stub:', e);
        }
      }
    }

    let captionResult: any;
    const hasAI = isHuggingFaceAvailable();

    if (imageBase64 && hasAI) {
      // Call the real AI with image bytes
      try {
        captionResult = await generateCaptionWithHuggingFace(imageBase64, style || 'casual', mimeType);
      } catch (aiErr) {
        console.error('Caption AI error, falling back:', aiErr);
        // Fall through to non-AI fallback below
      }
    }

    if (!captionResult) {
      // Non-AI fallback (used when file not found or no AI key)
      if (!imageBase64 && hasAI) {
        console.warn('Caption: no image bytes available; returning stub instead of claiming AI generated it.');
      }
      captionResult = {
        caption: `Check out this amazing ${photo.category || 'photo'}! 📸`,
        hashtags: ['travel', 'photooftheday', 'instagood'],
        emojis: ['😊', '👍'],
      };
    }

    // Normalize hashtags (strip leading '#') so storage and UI stay consistent
    const hashtags = (captionResult.hashtags || [])
      .filter((t: unknown): t is string => typeof t === 'string')
      .map((t: string) => t.replace(/^#+/, '').trim())
      .filter(Boolean);

    // Save caption to database
    const caption = await prisma.caption.create({
      data: {
        photoId: photo.id,
        userId: user.id,
        style: style || 'casual',
        caption: captionResult.caption,
        hashtags: JSON.stringify(hashtags),
        emojis: JSON.stringify(captionResult.emojis),
        charCount: captionResult.caption.length,
        isOptimal: style === 'casual',
        suggestionOrder: 0,
      },
    });

    return createSuccessResponse(
      {
        id: caption.id,
        caption: caption.caption,
        hashtags,
        emojis: captionResult.emojis,
        style: caption.style,
      },
      'Caption generated successfully'
    );
  } catch (error) {
    console.error('Caption generation error:', error);
    return handleAPIError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');
    const style = searchParams.get('style');

    if (!photoId) {
      return NextResponse.json(
        { success: false, error: 'Photo ID is required' },
        { status: 400 }
      );
    }

    const captions = await prisma.caption.findMany({
      where: { photoId, ...(style && { style }) },
      orderBy: { createdAt: 'desc' },
    });

    return createSuccessResponse(captions, 'Captions retrieved');
  } catch (error) {
    console.error('Get captions error:', error);
    return handleAPIError(error);
  }
}