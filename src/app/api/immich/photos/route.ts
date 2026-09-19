import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrCreateDefaultUser } from '@/lib/db';
import { handleAPIError, createSuccessResponse } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get('albumId');
    const user = await getOrCreateDefaultUser();
    const config = getImmichConfig(user);

    if (!albumId) {
      return NextResponse.json({ success: false, error: 'albumId is required' }, { status: 400 });
    }

    if (!config.url) {
      return NextResponse.json({ success: false, error: 'Immich not configured' }, { status: 400 });
    }

    const res = await fetch(`${config.url}/api/albums/${albumId}/assets?limit=200`, {
      headers: { 'x-api-key': config.key || '', Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return NextResponse.json(
        { success: false, error: `Immich assets error ${res.status}: ${body.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const assets = Array.isArray(data) ? data : (data.assets || []);

    return createSuccessResponse(
      assets.map((a: any) => ({
        id: a.id,
        fileName: a.originalFileName || a.fileName,
        fileUrl: `/api/immich/assets/${a.id}/thumbnail`,
        type: a.type,
        createdAt: a.localDateTime || a.createdAt,
      })),
      'Photos retrieved'
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