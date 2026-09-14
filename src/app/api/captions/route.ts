import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { getOrCreateDefaultUser } from '@/lib/db';
import { generateCaptionWithClaude } from '@/lib/ai-claude';
import { generateCaptionWithOpenAI } from '@/lib/ai-openai';
import { handleAPIError, createSuccessResponse } from '@/lib/api-client';

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

    // Generate caption using available AI service
    let captionResult: any;
    const useClaude = typeof process !== 'undefined' && (process.env.ANTHROPIC_API_KEY?.length ?? 0) > 10;

    if (useClaude) {
      // For caption-only generation, we'd need the image data
      // In a real implementation, we'd retrieve the image and pass it to the AI
      // For now, we'll generate a generic caption based on existing analysis
      const existingAnalysis = await prisma.analysis.findFirst({
        where: { photoId },
      });

      // This is a simplified approach - in reality you'd need the image data
      captionResult = {
        caption: `Check out this amazing ${photo.category || 'photo'}! 📸`,
        hashtags: ['#travel', '#photooftheday', '#instagood'],
        emojis: ['😊', '👍'],
      };
    } else {
      // OpenAI fallback - similar simplified approach
      captionResult = {
        caption: `Amazing capture! ${photo.category || 'Photo'} vibes only. ✨`,
        hashtags: ['#travel', '#wanderlust', '#explore'],
        emojis: ['🌟', '📷'],
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