import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrCreateDefaultUser } from '@/lib/db';
import { handleAPIError, createSuccessResponse } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  try {
    const user = await getOrCreateDefaultUser();
    const config = getImmichConfig(user);

    if (!config.url) {
      return NextResponse.json({ success: false, error: 'Immich not configured' }, { status: 400 });
    }

    const res = await fetch(`${config.url}/api/albums?limit=100`, {
      headers: { 'x-api-key': config.key || '', Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return NextResponse.json(
        { success: false, error: `Immich albums error ${res.status}: ${body.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const albums = Array.isArray(data) ? data : (data.albums || []);

    return createSuccessResponse(
      albums.map((a: any) => ({
        id: a.id,
        name: a.name ?? a.albumName,
        photoCount: a.assets?.length ?? a.fileCount ?? 0,
        createdAt: a.createdAt,
      })),
      'Albums retrieved'
    );
  } catch (error) {
    return handleAPIError(error);
  }
}

function getImmichConfig(user?: any) {
  const url = user?.immichUrl || process.env.IMMICH_URL || process.env.IMMICH_BASE_URL;
  const key = user?.immichApiKey || process.env.IMMICH_API_KEY;
  return { url, key };
}
