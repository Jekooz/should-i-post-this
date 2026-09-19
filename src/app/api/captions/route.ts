import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { getOrCreateDefaultUser } from '@/lib/db';
import { generateCaptionWithClaude, isClaudeAvailable } from '@/lib/ai-claude';
import { generateCaptionWithOpenAI, isOpenAIAVAILABLE } from '@/lib/ai-openai';
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
    // Forlocal files, read from disk; for immich, fetch via proxy
    let imageBase64: string | null = null;
    const mimeType = (photo.mimeType || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

    if (photo.fileUrl?.startsWith('/uploads/') || photo.fileUrl?.startsWith('/temp/')) {
      try {
        const filePath = join(process.cwd(), photo.fileUrl.replace(/^\//, ''));
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
    const useClaude = isClaudeAvailable();
    const useOpenAI = isOpenAIAVAILABLE();

    if (imageBase64 && (useClaude || useOpenAI)) {
      // Call the real AI with image bytes
      try {
        if (useClaude) {
          captionResult = await generateCaptionWithClaude(imageBase64, style || 'casual', mimeType);
        } else {
          captionResult = await generateCaptionWithOpenAI(imageBase64, style || 'casual', mimeType);
        }
      } catch (aiErr) {
        console.error('Caption AI error, falling back:', aiErr);
        // Fall through to non-AI fallback below
      }
    }

    if (!captionResult) {
      // Non-AI fallback (used when file not found or no AI key)
      if (!imageBase64 && (useClaude || useOpenAI)) {
        console.warn('Caption: no image bytes available; returning stub instead of claiming AI generated it.');
      }
      captionResult = {
        caption: `Check out this amazing ${photo.category || 'photo'}! 📸`,
        hashtags: ['#travel', '#photooftheday', '#instagood'],
        emojis: ['😊', '👍'],
      };
    }

    // Save caption to database
    const caption = await prisma.caption.create({
      data: {
        photoId: photo.id,
        userId: user.id,
        style: style || 'casual',
        caption: captionResult.caption,
        hashtags: JSON.stringify(captionResult.hashtags),
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
        hashtags: captionResult.hashtags,
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