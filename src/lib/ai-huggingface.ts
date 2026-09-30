import OpenAI from 'openai';
import { VisionAnalysisResponse, ScoreBreakdown } from '@/types/analysis';
import { env } from './env';

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

const CAPTION_PROMPT = (style: string) => `Generate a ${style} Instagram caption for this photo.
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

/** Vision endpoints only accept jpeg/png/webp/gif — HEIC/HEIF must be rejected before calling. */
export function toAIMimeType(mimeType: string | null | undefined): AIMimeType | null {
  if (!mimeType) return null;
  const normalized = mimeType.toLowerCase().split(';')[0];
  return (VALID_MEDIA_TYPES as readonly string[]).includes(normalized)
    ? (normalized as AIMimeType)
    : null;
}

/** Extract the first JSON object from a model response, tolerating markdown fences. */
export function extractJSON(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

// Lazily create the client: constructing an OpenAI instance without an API key
// throws at import time, which would crash every route that imports this file.
let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: env.HUGGINGFACE_API_KEY,
      // Hugging Face Inference Providers exposes an OpenAI-compatible router
      baseURL: env.HUGGINGFACE_BASE_URL || 'https://router.huggingface.co/v1',
      // Fail fast when the provider hangs instead of wedging the handler for minutes
      timeout: env.AI_REQUEST_TIMEOUT_MS,
      maxRetries: 1,
    });
  }
  return _client;
}

function clampScores(parsed: Partial<VisionAnalysisResponse> | null): ScoreBreakdown {
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

function chatContent(imageBase64: string, mimeType: AIMimeType, prompt: string) {
  return [
    { type: 'text' as const, text: prompt },
    {
      type: 'image_url' as const,
      image_url: { url: `data:${mimeType};base64,${imageBase64}` },
    },
  ];
}

export async function analyzeWithHuggingFace(
  imageBase64: string,
  mimeType: AIMimeType = 'image/jpeg'
): Promise<{ scores: ScoreBreakdown; rawResponse: Partial<VisionAnalysisResponse> }> {
  const response = await getClient().chat.completions.create({
    model: env.HUGGINGFACE_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: chatContent(imageBase64, mimeType, SYSTEM_PROMPT) }],
  });

  const text = response.choices[0]?.message?.content ?? '';
  const parsed = extractJSON(text) as Partial<VisionAnalysisResponse> | null;
  if (!parsed) {
    throw new Error('Hugging Face model returned a non-JSON analysis response');
  }

  return { scores: clampScores(parsed), rawResponse: parsed };
}

export async function generateCaptionWithHuggingFace(
  imageBase64: string,
  style: string = 'casual',
  mimeType: AIMimeType = 'image/jpeg'
) {
  const response = await getClient().chat.completions.create({
    model: env.HUGGINGFACE_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: chatContent(imageBase64, mimeType, CAPTION_PROMPT(style)) }],
  });

  const text = response.choices[0]?.message?.content ?? '';
  const parsed = extractJSON(text);
  if (!parsed || typeof parsed.caption !== 'string') {
    throw new Error('Hugging Face model returned a non-JSON caption response');
  }
  return parsed as { caption: string; hashtags?: string[]; emojis?: string[] };
}

export function isHuggingFaceAvailable(): boolean {
  return Boolean(
    env.HUGGINGFACE_API_KEY && env.HUGGINGFACE_API_KEY.length > 10
  );
}
