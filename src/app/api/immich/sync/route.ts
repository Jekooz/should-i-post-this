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

    const immichUrl = user.immichUrl || process.env.IMMICH_URL || process.env.IMMICH_BASE_URL || '';
    const immichApiKey = user.immichApiKey || process.env.IMMICH_API_KEY;

    // 1. Update or create the ImmichSync record for this user
    const existingSync = await prisma.immichSync.findFirst({
      where: { userId: user.id },
    });

    if (existingSync) {
      await prisma.immichSync.update({
        where: { id: existingSync.id },
        data: {
          lastSyncedAt: new Date(),
          photosCount: { increment: assetIds.length },
          albumsCount: { increment: 1 },
          status: 'idle',
        },
      });
    } else {
      await prisma.immichSync.create({
        data: {
          userId: user.id,
          serverUrl: immichUrl,
          apiKey: immichApiKey,
          status: 'idle',
          albumsCount: 1,
          photosCount: assetIds.length,
          lastSyncedAt: new Date(),
        },
      });
    }

    // 2. Sync photos to the database
    const syncedPhotos = await Promise.all(
      assetIds.map(async (assetId) => {
        return await prisma.photo.upsert({
          where: { id: assetId },
          update: { immichAlbumId: albumId },
          create: {
            id: assetId,
            userId: user.id,
            fileName: `immich_${assetId}.jpg`,
            fileSize: 1024 * 1024,
            mimeType: 'image/jpeg',
            fileUrl: `/api/immich/assets/${assetId}/thumbnail`,
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