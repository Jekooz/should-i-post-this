// Immich API integration placeholder - would normally call Immich REST API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrCreateDefaultUser } from '@/lib/db';
import { handleAPIError, createSuccessResponse } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'albums';
    const user = await getOrCreateDefaultUser();

    // In a real implementation, this would make HTTP requests to the Immich server
    // For now, returning mock data or empty arrays

    const config = getImmichConfig(user);
    if (!config.url) {
      return NextResponse.json({ success: false, error: 'Immich server URL not configured' }, { status: 400 });
    }

    if (endpoint === 'albums') {
      console.log('[Immich] GET albums from', config.url);
      const res = await fetch(`${config.url}/api/album?limit=100`, {
        headers: { 'x-api-key': config.key || '', Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      console.log('[Immich] GET albums status', res.status);
      if (!res.ok) {
        const body = await res.text().catch(() => '(no body)');
        console.error('[Immich] GET albums error body:', body.slice(0, 500));
        return NextResponse.json({ success: false, error: `Immich albums error ${res.status}: ${body.slice(0, 200)}` }, { status: 502 });
      }
      const data = await res.json();
      // Immich returns array directly
      const albums = Array.isArray(data) ? data : (data.albums || []);
      return createSuccessResponse(albums.map((a: any) => ({
        id: a.id,
        name: a.albumName || a.name,
        photoCount: a.assetCount ?? a.photoCount ?? 0,
        createdAt: a.createdAt,
      })), 'Albums retrieved');
    }

    if (endpoint === 'photos') {
      const albumId = searchParams.get('albumId');
      console.log('[Immich] GET photos albumId=', albumId, 'from', config.url);
      const qs = albumId ? `?albumId=${albumId}&limit=200` : '?limit=200';
      const res = await fetch(`${config.url}/api/asset${qs}`, {
        headers: { 'x-api-key': config.key || '', Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      console.log('[Immich] GET photos status', res.status);
      if (!res.ok) {
        const body = await res.text().catch(() => '(no body)');
        console.error('[Immich] GET photos error body:', body.slice(0, 500));
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
    }

    return NextResponse.json(
      { success: false, error: 'Invalid endpoint' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Immich API error:', error);
    return handleAPIError(error);
  }
}

function getImmichConfig(user?: { immichUrl?: string | null; immichApiKey?: string | null }) {
  const url = user?.immichUrl || process.env.IMMICH_URL || process.env.IMMICH_BASE_URL;
  const key = user?.immichApiKey || process.env.IMMICH_API_KEY;
  return { url, key };
}

async function testImmichConnection(serverUrl: string, apiKey?: string) {
  const cleanUrl = serverUrl.replace(/\/$/, '');
  console.log('[Immich] Testing connection to', cleanUrl);
  try {
    const res = await fetch(`${cleanUrl}/api/albums`, {
      headers: {
        'x-api-key': apiKey || '',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });
    console.log('[Immich] Connect response', res.status, res.statusText);
    if (!res.ok) {
      const body = await res.text().catch(() => '(no body)');
      console.error('[Immich] Connect failed body:', body.slice(0, 500));
      return { ok: false, status: res.status, body };
    }
    return { ok: true };
  } catch (e) {
    console.error('[Immich] Connect fetch error:', e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Accept endpoint either as query param or from body (client may POST to /api/immich directly)
    let endpoint = searchParams.get('endpoint') || '';
    const body = await request.json();
    if (!endpoint) {
      // if body looks like a connect request, treat as 'connect'
      if (body.serverUrl || body.url) endpoint = 'connect';
    }
    const user = await getOrCreateDefaultUser();

    if (endpoint === 'connect') {
      // Test connection to Immich server
      const serverUrl = body.serverUrl || body.url;
      const apiKey = body.apiKey || body.key;

      // Validate inputs — fall back to env vars if caller omitted them
      const effectiveUrl = serverUrl || process.env.IMMICH_URL || process.env.IMMICH_BASE_URL;
      const effectiveKey = apiKey || process.env.IMMICH_API_KEY;

      if (!effectiveUrl) {
        return NextResponse.json(
          { success: false, error: 'Server URL is required (set IMMICH_URL or pass serverUrl)' },
          { status: 400 }
        );
      }

      const result = await testImmichConnection(effectiveUrl, effectiveKey);

      if (result.ok) {
        // Update or create user record with Immich settings
        await prisma.user.upsert({
          where: { id: user.id },
          update: {
            immichUrl: effectiveUrl,
            immichApiKey: effectiveKey,
            immichConnected: true,
          },
          create: {
            id: user.id,
            email: user.email,
            immichUrl: effectiveUrl,
            immichApiKey: effectiveKey,
            immichConnected: true,
          }
        });

        return createSuccessResponse(
          { connected: true, message: 'Successfully connected to Immich server', url: effectiveUrl },
          'Immich connection successful'
        );
      } else {
        const msg =
          (result as any).body ||
          (result as any).error ||
          `Immich returned ${(result as any).status || 'unknown status'}`;
        return NextResponse.json(
          { success: false, error: `Immich connection failed: ${msg}` },
          { status: 502 }
        );
      }
    }

    if (endpoint === 'sync') {
      // Start sync from Immich
      const { dateFrom, dateTo, albumIds } = body;

      // In reality, this would trigger a background sync process
      // For now, return a mock sync ID
      const syncId = `sync-${Date.now()}`;

      return createSuccessResponse(
        { syncId, status: 'started', message: 'Immich sync started' },
        'Sync initiated'
      );
    }

    return NextResponse.json(
      { success: false, error: 'Invalid endpoint' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Immich POST error:', error);
    return handleAPIError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || '';

    if (endpoint === 'disconnect') {
      const user = await getOrCreateDefaultUser();

      // Clear Immich connection settings
      await prisma.user.update({
        where: { id: user.id },
        data: {
          immichUrl: null,
          immichApiKey: null,
          immichConnected: false,
        }
      });

      return createSuccessResponse(
        { disconnected: true, message: 'Disconnected from Immich server' },
        'Immich disconnected'
      );
    }

    return NextResponse.json(
      { success: false, error: 'Invalid endpoint' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Immich DELETE error:', error);
    return handleAPIError(error);
  }
}