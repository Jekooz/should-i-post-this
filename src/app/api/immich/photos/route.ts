import { NextRequest, NextResponse } from 'next/server';
import {
  getImmichConfig,
  immichGetJSON,
  asArray,
  mapAsset,
  type ImmichAssetDTO,
} from '@/lib/immich';
import { getOrCreateDefaultUser } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get('albumId');
    if (!albumId) {
      return NextResponse.json({ success: false, error: 'albumId is required' }, { status: 400 });
    }

    const user = await getOrCreateDefaultUser();
    const config = getImmichConfig(user);
    if (!config) {
      return NextResponse.json({ success: false, error: 'Immich not configured' }, { status: 400 });
    }

    const data = await immichGetJSON<ImmichAssetDTO[] | { assets?: ImmichAssetDTO[] }>(
      config,
      `/api/albums/${albumId}/assets`
    );
    return NextResponse.json({ success: true, data: asArray(data).map(mapAsset) });
  } catch (error) {
    console.error('Immich photos error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load photos',
      },
      { status: 502 }
    );
  }
}
