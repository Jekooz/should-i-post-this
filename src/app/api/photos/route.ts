import { NextRequest, NextResponse } from 'next/server';
import { prisma, getOrCreateDefaultUser } from '@/lib/db';
import { normalizePhoto } from '@/lib/immich';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 200);

    const user = await getOrCreateDefaultUser();

    const photos = await prisma.photo.findMany({
      where: {
        userId: user.id,
        ...(source === 'manual' || source === 'immich' ? { source } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        thumbnailUrl: true,
        fileSize: true,
        mimeType: true,
        overallScore: true,
        category: true,
        source: true,
        analyzed: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: photos.map(normalizePhoto),
      message: 'Photos retrieved',
    });
  } catch (error) {
    console.error('Photos API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}
