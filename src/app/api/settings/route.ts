import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrCreateDefaultUser } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getOrCreateDefaultUser();

    // Read secret env vars server-side. NEVER return their values to the client.
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const immichUrl = user.immichUrl || process.env.IMMICH_URL || process.env.IMMICH_BASE_URL || '';
    const immichApiKey = user.immichApiKey || process.env.IMMICH_API_KEY;

    // Expose only booleans and the (non-secret) URL/immich connection status
    return NextResponse.json({
      hasAnthropicKey: Boolean(anthropicKey && anthropicKey.length > 0),
      hasOpenAIKey: Boolean(openaiKey && openaiKey.length > 0),
      immich: {
        url: immichUrl,
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