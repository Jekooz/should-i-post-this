import OpenAI from 'openai';
import { ClaudeVisionResponse, ScoreBreakdown } from '@/types/analysis';
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

// Lazily create the client: constructing an OpenAI instance without an API key
// throws at import time, which would crash every route that imports this file.
let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: env.OPENAI_API_KEY!,
      // Support gateways/proxies via env (e.g. OPENAI_BASE_URL=https://gateway.example.com/openai/v1)
      baseURL: env.OPENAI_BASE_URL || undefined,
      // Fail fast when the provider hangs instead of wedging the handler for minutes
      timeout: env.AI_REQUEST_TIMEOUT_MS,
      maxRetries: 1,
    });
  }
  return _client;
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

function toScores(parsed: Partial<ClaudeVisionResponse> | null): ScoreBreakdown {
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

export async function analyzeWithOpenAI(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<{ scores: ScoreBreakdown; rawResponse: Partial<ClaudeVisionResponse> }> {
  const response = await getClient().chat.completions.create({
    model: env.OPENAI_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: SYSTEM_PROMPT },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
              // gpt-4o defaults to "auto" detail which can be expensive; keep auto for accuracy.
            },
          },
        ],
      },
    ],
    max_tokens: 1024,
    response_format: { type: 'json_object' },
  });

  const text = response.choices[0]?.message?.content ?? '';
  const parsed = extractJSON(text) as Partial<ClaudeVisionResponse> | null;
  if (!parsed) {
    throw new Error('OpenAI returned a non-JSON analysis response');
  }

  return { scores: toScores(parsed), rawResponse: parsed };
}

export async function generateCaptionWithOpenAI(
  imageBase64: string,
  style: string = 'casual',
  mimeType: string = 'image/jpeg'
) {
  const response = await getClient().chat.completions.create({
    model: env.OPENAI_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Generate a ${style} Instagram caption for this photo. Include: 1) An engaging caption (max 150 words), 2) 10-15 relevant hashtags, 3) 2-5 appropriate emojis. Return ONLY valid JSON: { "caption": "...", "hashtags": ["#tag1", "#tag2"], "emojis": ["emoji1", "emoji2"] }`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 1024,
    response_format: { type: 'json_object' },
  });

  const text = response.choices[0]?.message?.content ?? '';
  const parsed = extractJSON(text);
  if (!parsed || typeof parsed.caption !== 'string') {
    throw new Error('OpenAI returned a non-JSON caption response');
  }
  return parsed as { caption: string; hashtags?: string[]; emojis?: string[] };
}

export function isOpenAIAvailable(): boolean {
  return Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.length > 10);
}
