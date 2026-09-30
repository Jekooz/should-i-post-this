import { NextRequest, NextResponse } from 'next/server';
import { prisma, getOrCreateDefaultUser } from '@/lib/db';
import {
  getImmichConfig,
  immichGetJSON,
  asArray,
  testImmichConnection,
  mapAlbum,
  mapAsset,
  type ImmichAlbumDTO,
  type ImmichAssetDTO,
} from '@/lib/immich';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || '';
    const user = await getOrCreateDefaultUser();

    if (endpoint === 'status') {
      const config = getImmichConfig(user);
      return NextResponse.json({
        success: true,
        data: {
          configured: Boolean(config),
          connected: Boolean(user.immichConnected),
          url: config?.url ?? null,
        },
      });
    }

    const config = getImmichConfig(user);
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Immich server URL not configured. Set it in Settings.' },
        { status: 400 }
      );
    }

    if (endpoint === 'albums') {
      const albums = await immichGetJSON<ImmichAlbumDTO[] | { albums?: ImmichAlbumDTO[] }>(
        config,
        '/api/albums?limit=100'
      );
      return NextResponse.json({ success: true, data: asArray(albums).map(mapAlbum) });
    }

    if (endpoint === 'photos') {
      const albumId = searchParams.get('albumId');
      if (!albumId) {
        return NextResponse.json(
          { success: false, error: 'albumId is required' },
          { status: 400 }
        );
      }
      const data = await immichGetJSON<ImmichAssetDTO[] | { assets?: ImmichAssetDTO[] }>(
        config,
        `/api/albums/${albumId}/assets`
      );
      return NextResponse.json({ success: true, data: asArray(data).map(mapAsset) });
    }

    return NextResponse.json({ success: false, error: 'Invalid endpoint' }, { status: 400 });
  } catch (error) {
    console.error('Immich API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Immich request failed',
      },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let endpoint = searchParams.get('endpoint') || '';
    const body = await request.json().catch(() => ({}));
    if (!endpoint && (body.serverUrl || body.url)) endpoint = 'connect';

    if (endpoint === 'connect') {
      const serverUrl = (body.serverUrl || body.url) as string | undefined;
      const apiKey = (body.apiKey || body.key) as string | undefined;

      const effectiveUrl = serverUrl || process.env.IMMICH_URL || process.env.IMMICH_BASE_URL;
      const effectiveKey = apiKey || process.env.IMMICH_API_KEY || '';

      if (!effectiveUrl) {
        return NextResponse.json(
          { success: false, error: 'Server URL is required (set IMMICH_URL or pass serverUrl)' },
          { status: 400 }
        );
      }

      const config = { url: effectiveUrl.replace(/\/+$/, ''), key: effectiveKey };
      const ok = await testImmichConnection(config);

      if (!ok) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Could not reach the Immich server or the API key was rejected. Check the URL and key.',
          },
          { status: 502 }
        );
      }

      const user = await getOrCreateDefaultUser();
      await prisma.user.update({
        where: { id: user.id },
        data: { immichUrl: config.url, immichApiKey: effectiveKey, immichConnected: true },
      });

      return NextResponse.json({
        success: true,
        data: { connected: true, url: config.url },
        message: 'Successfully connected to Immich server',
      });
    }

    if (endpoint === 'sync') {
      // Full server sync: import recent assets (optionally filtered by album/date range)
      // as Photo rows backed by the thumbnail proxy.
      const config = getImmichConfig();
      if (!config) {
        return NextResponse.json(
          { success: false, error: 'Immich not configured' },
          { status: 400 }
        );
      }

      const user = await getOrCreateDefaultUser();
      const { albumId, dateFrom, dateTo } = body as {
        albumId?: string;
        dateFrom?: string;
        dateTo?: string;
      };

      // Gather assets: from one album, or the library within a date range.
      let assets: ImmichAssetDTO[] = [];
      if (albumId) {
        const data = await immichGetJSON<ImmichAssetDTO[] | { assets?: ImmichAssetDTO[] }>(
          config,
          `/api/albums/${albumId}/assets`
        );
        assets = asArray(data);
      } else {
        const searchBody: Record<string, unknown> = { size: 500, type: 'IMAGE' };
        if (dateFrom) searchBody.takenAfter = new Date(dateFrom).toISOString();
        if (dateTo) searchBody.takenBefore = new Date(dateTo).toISOString();
        const res = await fetch(`${config.url}/api/search/metadata`, {
          method: 'POST',
          headers: { 'x-api-key': config.key, 'Content-Type': 'application/json' },
          body: JSON.stringify(searchBody),
          signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) {
          const errBody = await res.text().catch(() => '');
          return NextResponse.json(
            { success: false, error: `Immich search failed ${res.status}: ${errBody.slice(0, 200)}` },
            { status: 502 }
          );
        }
        const data = (await res.json()) as { assets?: { id: string }[] };
        assets = (data.assets || []).map((a) => ({ id: a.id, originalFileName: `immich_${a.id}` }));
      }

      let synced = 0;
      for (const asset of assets) {
        const mapped = mapAsset(asset);
        await prisma.photo.upsert({
          where: {
            id: `immich-${asset.id}`,
          },
          update: {
            source: 'immich',
            analyzed: false,
          },
          create: {
            id: `immich-${asset.id}`,
            userId: user.id,
            fileName: mapped.fileName,
            fileSize: 0,
            mimeType: 'image/jpeg',
            fileUrl: mapped.thumbnailUrl,
            thumbnailUrl: mapped.thumbnailUrl,
            source: 'immich',
            immichAssetId: asset.id,
            immichAlbumId: albumId ?? null,
          },
        });
        synced++;
      }

      // Record sync metadata
      const existing = await prisma.immichSync.findFirst({ where: { userId: user.id } });
      const syncData = {
        serverUrl: config.url,
        status: 'connected',
        lastSyncedAt: new Date(),
        albumsCount: albumId ? 1 : undefined,
        photosCount: synced,
      };
      if (existing) {
        await prisma.immichSync.update({
          where: { id: existing.id },
          data: syncData,
        });
      } else {
        await prisma.immichSync.create({
          data: { userId: user.id, ...syncData },
        });
      }

      return NextResponse.json({
        success: true,
        data: { syncedCount: synced },
        message: 'Photos synced from Immich',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid endpoint' }, { status: 400 });
  } catch (error) {
    console.error('Immich POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Immich request failed',
      },
      { status: 502 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || '';

    if (endpoint === 'disconnect') {
      const user = await getOrCreateDefaultUser();
      await prisma.user.update({
        where: { id: user.id },
        data: { immichUrl: null, immichApiKey: null, immichConnected: false },
      });
      return NextResponse.json({
        success: true,
        data: { disconnected: true },
        message: 'Disconnected from Immich server',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid endpoint' }, { status: 400 });
  } catch (error) {
    console.error('Immich DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to disconnect' }, { status: 500 });
  }
}
