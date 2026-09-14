import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrCreateDefaultUser } from '@/lib/db';
import { handleAPIError, createSuccessResponse } from '@/lib/api-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { albumId, assetIds } = body;
    const user = await getOrCreateDefaultUser();

    if (!albumId || !assetIds || !Array.isArray(assetIds)) {
      return NextResponse.json(
        { success: false, error: 'albumId and assetIds are required' },
        { status: 400 }
      );
    }

    // Mocking the sync process:
    // 1. In reality, we'd fetch the assets from Immich
    // 2. Store them in the local Photo table as 'source: immich'

    const syncedPhotos = await Promise.all(
      assetIds.map(async (assetId) => {
        return await prisma.photo.upsert({
          where: { id: assetId }, // simplifying assetId as photoId
          update: { immichAlbumId: albumId },
          create: {
            id: assetId,
            userId: user.id,
            fileName: `immich_${assetId}.jpg`,
            fileSize: 1024 * 1024,
            mimeType: 'image/jpeg',
            fileUrl: `https://via.placeholder.com/300?text=${assetId}`,
            source: 'immich',
            immichAssetId: assetId,
            immichAlbumId: albumId,
          },
        });
      })
    );

    return createSuccessResponse(
      { syncedCount: syncedPhotos.length },
      'Photos synced from Immich'
    );
  } catch (error) {
    return handleAPIError(error);
  }
}