import { NextRequest, NextResponse } from 'next/server';
import { prisma, getOrCreateDefaultUser } from '@/lib/db';
import { getImmichConfig, immichGetJSON, asArray, type ImmichAssetDTO } from '@/lib/immich';

export const dynamic = 'force-dynamic';

/** Sync a specific album's assets into the local database as Photo rows. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { albumId, assetIds } = body as { albumId?: string; assetIds?: string[] };
    const user = await getOrCreateDefaultUser();

    if (!albumId || !assetIds || !Array.isArray(assetIds)) {
      return NextResponse.json(
        { success: false, error: 'albumId and assetIds are required' },
        { status: 400 }
      );
    }

    const config = getImmichConfig(user);
    if (!config) {
      return NextResponse.json({ success: false, error: 'Immich not configured' }, { status: 400 });
    }

    // Fetch real metadata so file names and dates are correct (not `immich_<uuid>.jpg`).
    const data = await immichGetJSON<ImmichAssetDTO[] | { assets?: ImmichAssetDTO[] }>(
      config,
      `/api/albums/${albumId}/assets`
    );
    const wanted = new Set(assetIds);
    const assets = asArray(data).filter((a) => wanted.has(a.id));

    let synced = 0;
    for (const asset of assets) {
      await prisma.photo.upsert({
        where: { id: `immich-${asset.id}` },
        update: { immichAlbumId: albumId, source: 'immich', analyzed: false },
        create: {
          id: `immich-${asset.id}`,
          userId: user.id,
          fileName: asset.originalFileName || `immich_${asset.id}`,
          fileSize: 0,
          mimeType: 'image/jpeg',
          fileUrl: `/api/immich/assets/${asset.id}/thumbnail`,
          thumbnailUrl: `/api/immich/assets/${asset.id}/thumbnail`,
          source: 'immich',
          immichAssetId: asset.id,
          immichAlbumId: albumId,
          dateTaken: asset.localDateTime ? new Date(asset.localDateTime) : null,
        },
      });
      synced++;
    }

    // Update sync record
    const existing = await prisma.immichSync.findFirst({ where: { userId: user.id } });
    if (existing) {
      await prisma.immichSync.update({
        where: { id: existing.id },
        data: {
          lastSyncedAt: new Date(),
          photosCount: { increment: synced },
          albumsCount: { increment: 1 },
          status: 'connected',
        },
      });
    } else {
      await prisma.immichSync.create({
        data: {
          userId: user.id,
          serverUrl: config.url,
          apiKey: null,
          status: 'connected',
          albumsCount: 1,
          photosCount: synced,
          lastSyncedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { syncedCount: synced },
      message: 'Photos synced from Immich',
    });
  } catch (error) {
    console.error('Immich sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 502 }
    );
  }
}
