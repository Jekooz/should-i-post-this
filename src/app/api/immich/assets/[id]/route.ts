import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrCreateDefaultUser } from '@/lib/db';
import { handleAPIError } from '@/lib/api-client';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: assetId } = await params;
    const user = await getOrCreateDefaultUser();

    if (!user.immichConnected || !user.immichUrl) {
      return NextResponse.json(
        { success: false, error: 'Immich not connected' },
        { status: 400 }
      );
    }

    // Real implementation: proxy the image from Immich using the API key
    // const response = await fetch(`${user.immichUrl}/api/assets/${assetId}`, {
    //   headers: { 'x-api-key': user.immichApiKey },
    // });
    // return response;

    // Mocking the proxy for now
    // Proxy Immich asset image directly
return NextResponse.redirect(`${user.immichUrl}/api/assets/${assetId}`);
  } catch (error) {
    return handleAPIError(error);
  }
}