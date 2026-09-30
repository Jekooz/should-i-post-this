import { NextRequest, NextResponse } from 'next/server';
import { getImmichConfig, immichGetBinary, ImmichError } from '@/lib/immich';
import { getOrCreateDefaultUser } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Proxies Immich asset binaries so the browser never sees the Immich URL/API key.
 * GET /api/immich/assets/<assetId>            → original file
 * GET /api/immich/assets/<assetId>/thumbnail  → preview thumbnail
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assetId = params.id;
    const isThumbnail = request.nextUrl.pathname.endsWith('/thumbnail');
    if (!assetId) {
      return NextResponse.json({ success: false, error: 'Asset ID required' }, { status: 400 });
    }

    const user = await getOrCreateDefaultUser();
    const config = getImmichConfig(user);
    if (!config) {
      return NextResponse.json({ success: false, error: 'Immich not configured' }, { status: 400 });
    }

    // Basic SSRF guard
    try {
      const urlObj = new URL(config.url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return NextResponse.json({ success: false, error: 'Invalid Immich URL' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid Immich URL' }, { status: 400 });
    }

    const path = isThumbnail
      ? `/api/assets/${assetId}/thumbnail?size=preview`
      : `/api/assets/${assetId}/original`;

    const { buffer, contentType } = await immichGetBinary(config, path);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Immich asset route error:', error);
    const status = error instanceof ImmichError ? (error.status === 404 ? 404 : 502) : 500;
    return NextResponse.json({ success: false, error: 'Unable to fetch asset' }, { status });
  }
}
