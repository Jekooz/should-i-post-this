import { NextRequest, NextResponse } from 'next/server';
import {
  getImmichConfig,
  immichGetJSON,
  asArray,
  mapAlbum,
  type ImmichAlbumDTO,
} from '@/lib/immich';
import { getOrCreateDefaultUser } from '@/lib/db';

// Never call the Immich server during build-time prerendering.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();
    const config = getImmichConfig(user);
    if (!config) {
      return NextResponse.json({ success: false, error: 'Immich not configured' }, { status: 400 });
    }

    const albums = await immichGetJSON<ImmichAlbumDTO[] | { albums?: ImmichAlbumDTO[] }>(
      config,
      '/api/albums?limit=100'
    );
    return NextResponse.json({ success: true, data: asArray(albums).map(mapAlbum) });
  } catch (error) {
    console.error('Immich albums error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load albums',
      },
      { status: 502 }
    );
  }
}
