import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

import { prisma } from '@/lib/db';
import { getOrCreateDefaultUser } from '@/lib/db';
import { analyzeWithClaude, generateCaptionWithClaude, isClaudeAvailable } from '@/lib/ai-claude';
import { analyzeWithOpenAI, generateCaptionWithOpenAI, isOpenAIAVAILABLE } from '@/lib/ai-openai';
import { handleAPIError, createSuccessResponse } from '@/lib/api-client';
import { SUPPORTED_MIME_TYPES, MAX_FILE_SIZE } from '@/types/photo';
import type { ScoreBreakdown } from '@/types/analysis';

export const maxDuration = 60; // 60 seconds for image analysis

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const analyzeType = formData.get('type') as string || 'full'; // 'full', 'scores-only', 'caption-only'
    const captionStyle = formData.get('style') as string || 'casual';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type. Supported types: ${SUPPORTED_MIME_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename and save to uploads
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const filePath = join(uploadsDir, uniqueFilename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Get default user
    const user = await getOrCreateDefaultUser();

    // Determine which AI service to use
    const useClaude = isClaudeAvailable();
    const useOpenAI = !useClaude && isOpenAIAVAILABLE();

    if (!useClaude && !useOpenAI) {
      return NextResponse.json(
        { success: false, error: 'No AI service available. Please configure API keys.' },
        { status: 503 }
      );
    }

    // Read the file as base64 for AI analysis
    const base64Image = buffer.toString('base64');

    let analysisResult: { scores: ScoreBreakdown; rawResponse: any } | null = null;
    let captionResult: any = null;

    try {
      if (analyzeType === 'full' || analyzeType === 'scores-only') {
        // Run image analysis
        if (useClaude) {
          analysisResult = await analyzeWithClaude(base64Image, file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif');
        } else {
          analysisResult = await analyzeWithOpenAI(base64Image, file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif');
        }
      }

      if (analyzeType === 'full' || analyzeType === 'caption-only') {
        // Generate caption
        if (useClaude) {
          captionResult = await generateCaptionWithClaude(base64Image, captionStyle, file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif');
        } else {
          captionResult = await generateCaptionWithOpenAI(base64Image, captionStyle, file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif');
        }
      }

      // Save photo record in database
      const photo = await prisma.photo.create({
        data: {
          userId: user.id,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          fileUrl: `/api/uploads/${uniqueFilename}`, // Use secure upload route
          source: 'manual',
          analyzed: analyzeType !== 'caption-only',
          analyzedAt: analyzeType !== 'caption-only' ? new Date() : null,
          overallScore: analysisResult?.scores.overall ?? null,
          aestheticScore: analysisResult?.scores.aesthetic ?? null,
          emotionScore: analysisResult?.scores.emotion ?? null,
          socialScore: analysisResult?.scores.social ?? null,
          compositionScore: analysisResult?.scores.composition ?? null,
        },
      });

      // Save analysis results if we have them
      if (analysisResult) {
        await prisma.analysis.create({
          data: {
            photoId: photo.id,
            userId: user.id,
            aiResponse: JSON.stringify(analysisResult.rawResponse),
            modelUsed: useClaude ? 'claude-vision' : 'openai-vision',
            promptUsed: analyzeType === 'full' || analyzeType === 'scores-only' ? 'photo_analysis' : 'none',
            composition: JSON.stringify({
              score: analysisResult.scores.composition,
              reasoning: analysisResult.rawResponse.composition?.reasoning,
              details: analysisResult.rawResponse.composition?.details,
            }),
            emotion: JSON.stringify({
              score: analysisResult.scores.emotion,
              reasoning: analysisResult.rawResponse.emotion?.reasoning,
              details: analysisResult.rawResponse.emotion?.details,
            }),
            aesthetic: JSON.stringify({
              score: analysisResult.scores.aesthetic,
              reasoning: analysisResult.rawResponse.aesthetic?.reasoning,
              details: analysisResult.rawResponse.aesthetic?.details,
            }),
            social: JSON.stringify({
              score: analysisResult.scores.social,
              reasoning: analysisResult.rawResponse.social?.reasoning,
              details: analysisResult.rawResponse.social?.details,
            }),
            processingTime: 0, // We don't measure this yet
            tokenUsage: analysisResult.rawResponse.tokenUsage,
            cost: 0, // We don't calculate cost yet
          },
        });
      }

      // Save caption if we have it
      if (captionResult) {
        await prisma.caption.create({
          data: {
            photoId: photo.id,
            userId: user.id,
            style: captionStyle,
            caption: captionResult.caption,
            hashtags: JSON.stringify(captionResult.hashtags),
            emojis: JSON.stringify(captionResult.emojis),
            charCount: captionResult.caption.length,
            isOptimal: captionStyle === 'casual', // Assume casual is optimal for now
            suggestionOrder: 0,
          },
        });
      }

      return createSuccessResponse(
        {
          photoId: photo.id,
          scores: analysisResult?.scores ?? null,
          caption: captionResult?.caption ?? null,
          hashtags: captionResult?.hashtags ?? null,
          emojis: captionResult?.emojis ?? null,
        },
        'Photo analyzed successfully'
      );
    } catch (aiError) {
      console.error('AI processing error:', aiError);
      throw aiError;
    }
  } catch (error) {
    console.error('Analysis error:', error);
    return handleAPIError(error);
  }
}