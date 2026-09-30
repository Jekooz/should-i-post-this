import Anthropic from '@anthropic-ai/sdk';
import { ClaudeVisionResponse, ScoreBreakdown } from '@/types/analysis';
import { env } from './env';
import { extractJSON } from './ai-openai';

const SYSTEM_PROMPT = `You are an expert photo analyst and social media content creator.
Analyze the photo and score it across 4 dimensions (0-10 scale):

COMPOSITION: Rule of thirds, leading lines, framing, balance, visual simplicity
EMOTION: Facial expressions, mood, intensity, authenticity, storytelling
AESTHETIC: Lighting quality, color harmony, sharpness, contrast, noise level
SOCIAL: Shareability, engagement potential, trend alignment, clarity

Return ONLY valid JSON in this exact structure:
{
  "composition": { "score": 0-10, "reasoning": "...", "details": { "ruleOfThirds": true, "leadingLines": true, "framing": true, "balance": true, "simplicity": true } },
  "emotion": { "score": 0-10, "reasoning": "...", "details": { "mood": "...", "intensity": 0-10, "authenticity": true } },
  "aesthetic": { "score": 0-10, "reasoning": "...", "details": { "lighting": "...", "colorHarmony": true, "sharpness": 0-10, "contrast": 0-10, "noise": 0-10 } },
  "social": { "score": 0-10, "reasoning": "...", "details": { "shareability": 0-10, "engagementPotential": 0-10, "trendAlignment": 0-10, "clarity": 0-10 } },
  "category": "landscape|portrait|group|food|architecture|wildlife|street|action|other",
  "tags": ["tag1", "tag2"],
  "suggestedCaption": "A short social media caption for this photo"
}`;

const CAPTION_PROMPT = (style: string, context?: string) => `Generate a ${style} Instagram caption for this photo.
${context ? `Context: ${context}\n` : ''}
Include:
1. An engaging caption (max 150 words)
2. 10-15 relevant hashtags
3. 2-5 appropriate emojis

Return ONLY valid JSON:
{
  "caption": "...",
  "hashtags": ["#tag1", "#tag2"],
  "emojis": ["emoji1", "emoji2"]
}`;

const VALID_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export type AIMimeType = (typeof VALID_MEDIA_TYPES)[number];

/** Claude only accepts jpeg/png/webp/gif — HEIC/HEIF must be rejected before calling. */
export function toAIMimeType(mimeType: string | null | undefined): AIMimeType | null {
  if (!mimeType) return null;
  const normalized = mimeType.toLowerCase().split(';')[0];
  return (VALID_MEDIA_TYPES as readonly string[]).includes(normalized)
    ? (normalized as AIMimeType)
    : null;
}

// Lazily create the client so a missing key doesn't crash at import time.
let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY!,
      // Support gateways/proxies via env (e.g. ANTHROPIC_BASE_URL=https://gateway.example.com/anthropic)
      baseURL: env.ANTHROPIC_BASE_URL || undefined,
    });
  }
  return _client;
}

function clampScores(parsed: Partial<ClaudeVisionResponse> | null): ScoreBreakdown {
  const clamp = (n: unknown) => Math.min(10, Math.max(0, Number(n) || 0));
  const scores: ScoreBreakdown = {
    composition: clamp(parsed?.composition?.score),
    emotion: clamp(parsed?.emotion?.score),
    aesthetic: clamp(parsed?.aesthetic?.score),
    social: clamp(parsed?.social?.score),
    overall: 0,
  };
  scores.overall =
    Math.round(((scores.composition + scores.emotion + scores.aesthetic + scores.social) / 4) * 100) / 100;
  return scores;
}

export async function analyzeWithClaude(
  imageBase64: string,
  mimeType: AIMimeType = 'image/jpeg'
): Promise<{ scores: ScoreBreakdown; rawResponse: Partial<ClaudeVisionResponse> }> {
  const response = await getClient().messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: imageBase64,
            },
          },
          { type: 'text', text: SYSTEM_PROMPT },
        ],
      },
    ],
  });

  const text = response.content.find((c) => c.type === 'text')?.text ?? '';
  const parsed = extractJSON(text) as Partial<ClaudeVisionResponse> | null;
  if (!parsed) {
    throw new Error('Claude returned a non-JSON analysis response');
  }

  return { scores: clampScores(parsed), rawResponse: parsed };
}

export async function generateCaptionWithClaude(
  imageBase64: string,
  style: string = 'casual',
  mimeType: AIMimeType = 'image/jpeg'
) {
  const response = await getClient().messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: imageBase64,
            },
          },
          { type: 'text', text: CAPTION_PROMPT(style) },
        ],
      },
    ],
  });

  const text = response.content.find((c) => c.type === 'text')?.text ?? '';
  const parsed = extractJSON(text);
  if (!parsed || typeof parsed.caption !== 'string') {
    throw new Error('Claude returned a non-JSON caption response');
  }
  return parsed as { caption: string; hashtags?: string[]; emojis?: string[] };
}

export function isClaudeAvailable(): boolean {
  return Boolean(env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY.length > 10);
}
