import Anthropic from '@anthropic-ai/sdk';
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
  "composition": { "score": 0-10, "reasoning": "...", "details": { "ruleOfThirds": bool, "leadingLines": bool, "framing": bool, "balance": bool, "simplicity": bool } },
  "emotion": { "score": 0-10, "reasoning": "...", "details": { "mood": "...", "intensity": 0-10, "authenticity": bool } },
  "aesthetic": { "score": 0-10, "reasoning": "...", "details": { "lighting": "...", "colorHarmony": bool, "sharpness": 0-10, "contrast": 0-10, "noise": 0-10 } },
  "social": { "score": 0-10, "reasoning": "...", "details": { "shareability": 0-10, "engagementPotential": 0-10, "trendAlignment": 0-10, "clarity": 0-10 } },
  "category": "landscape|portrait|group|food|architecture|wildlife|street|action|other",
  "tags": ["tag1", "tag2"],
  "suggestedCaption": "A short social media caption for this photo"
}`;

const CAPTION_PROMPT = (style: string, context?: string) => `Generate a ${style} Instagram caption for this photo.
${context ? `Context: ${context}` : ''}
Include:
1. An engaging caption (max 150 words)
2. 10-15 relevant hashtags
3. 2-5 appropriate emojis

Return ONLY valid JSON:
{
  "caption": "...",
  "hashtags": ["#tag1", "#tag2", ...],
  "emojis": ["emoji1", "emoji2", ...]
}`;

export async function analyzeWithClaude(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
): Promise<{ scores: ScoreBreakdown; rawResponse: ClaudeVisionResponse }> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY! });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
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

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  const json = text.match(/\{[\s\S]*\}/)?.[0] || '{}';
  const parsed = JSON.parse(json) as ClaudeVisionResponse;

  const scores: ScoreBreakdown = {
    composition: parsed.composition?.score ?? 5,
    emotion: parsed.emotion?.score ?? 5,
    aesthetic: parsed.aesthetic?.score ?? 5,
    social: parsed.social?.score ?? 5,
    overall: 0,
  };
  scores.overall = (scores.composition + scores.emotion + scores.aesthetic + scores.social) / 4;

  return { scores, rawResponse: parsed };
}

export async function generateCaptionWithClaude(
  imageBase64: string,
  style: string = 'casual',
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY! });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
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

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  const json = text.match(/\{[\s\S]*\}/)?.[0] || '{}';
  return JSON.parse(json);
}

export function isClaudeAvailable(): boolean {
  return Boolean(env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY.length > 10);
}
