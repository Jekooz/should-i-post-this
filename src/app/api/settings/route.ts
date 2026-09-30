import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrCreateDefaultUser } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getOrCreateDefaultUser();

    // Read secret env vars server-side. NEVER return their values to the client.
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    const immichUrl = user.immichUrl || process.env.IMMICH_URL || process.env.IMMICH_BASE_URL || '';
    const immichApiKey = user.immichApiKey || process.env.IMMICH_API_KEY;

    // Expose only booleans — never return the actual Immich URL or API keys to the browser
    return NextResponse.json({
      hasHuggingFaceKey: Boolean(hfKey && hfKey.length > 0),
      immich: {
        hasUrl: Boolean(immichUrl && immichUrl.length > 0),
        hasApiKey: Boolean(immichApiKey && immichApiKey.length > 0),
        connected: Boolean(user.immichConnected),
      },
    });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}