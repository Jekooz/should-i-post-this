import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrCreateDefaultUser } from '@/lib/db';
import { handleAPIError, createSuccessResponse } from '@/lib/api-client';

function getConfig(user?: any) {
  return {
    url: user?.immichUrl || process.env.IMMICH_URL || process.env.IMMICH_BASE_URL,
    key: user?.immichApiKey || process.env.IMMICH_API_KEY,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get('albumId');
    const user = await getOrCreateDefaultUser();
    const config = getConfig(user);

    if (!albumId) {
      return NextResponse.json({ success: false, error: 'albumId is required' }, { status: 400 });
    }

    if (!config.url) {
      return NextResponse.json({ success: false, error: 'Immich not configured' }, { status: 400 });
    }

    const qs = `?albumId=${albumId}&limit=200`;
    const res = await fetch(`${config.url}/api/asset${qs}`, {
      headers: { 'x-api-key': config.key || '', Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return NextResponse.json({ success: false, error: `Immich assets error ${res.status}: ${body.slice(0, 200)}` }, { status: 502 });
    }

    const data = await res.json();
    const photos = Array.isArray(data) ? data : (data.assets || []);

    return createSuccessResponse(photos.map((p: any) => ({
      id: p.id,
      fileName: p.originalFileName || p.fileName || p.id,
      fileUrl: `${config.url}/api/asset/thumbnail/${p.id}`,
      type: p.type,
      createdAt: p.localDateTime || p.createdAt,
    })), 'Photos retrieved');
  } catch (error) {
    return handleAPIError(error);
  }
}