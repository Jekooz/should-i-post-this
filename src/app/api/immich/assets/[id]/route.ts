import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrCreateDefaultUser } from '@/lib/db';
import { handleAPIError } from '@/lib/api-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: assetId } = params;
    if (!assetId) {
      return NextResponse.json(
        { success: false, error: 'Asset ID required' },
        { status: 400 }
      );
    }

    const user = await getOrCreateDefaultUser();
    const immichUrl = user?.immichUrl || process.env.IMMICH_URL || process.env.IMMICH_BASE_URL;
    const immichApiKey = user?.immichApiKey || process.env.IMMICH_API_KEY;

    if (!immichUrl) {
      return NextResponse.json(
        { success: false, error: 'Immich not configured' },
        { status: 400 }
      );
    }

    // Basic SSRF protection: only allow http/https
    try {
      const urlObj = new URL(immichUrl);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return NextResponse.json(
          { success: false, error: 'Invalid Immich URL' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid Immich URL' },
        { status: 400 }
      );
    }

    // Forward the request to Immich with the API key
    const immichResponse = await fetch(`${immichUrl}/api/assets/${assetId}`, {
      headers: {
        'x-api-key': immichApiKey || '',
        Accept: 'image/*',
      },
    });

    if (!immichResponse.ok) {
      console.error(`Immich asset error ${immichResponse.status} for assetId ${assetId}`);
      return NextResponse.json(
        { success: false, error: 'Unable to fetch asset' },
        { status: 502 }
      );
    }

    const contentType = immichResponse.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await immichResponse.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Immich asset route error:', error);
    return handleAPIError(error);
  }
}