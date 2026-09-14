import OpenAI from "openai";
import { ClaudeVisionResponse, ScoreBreakdown } from '@/types/analysis';
import { env } from "./env";

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY! });

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

export async function analyzeWithOpenAI(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<{ scores: ScoreBreakdown; rawResponse: ClaudeVisionResponse }> {
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: SYSTEM_PROMPT },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 1024,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(text) as ClaudeVisionResponse;

  const scores: ScoreBreakdown = {
    composition: parsed.composition?.score ?? 5,
    emotion: parsed.emotion?.score ?? 5,
    aesthetic: parsed.aesthetic?.score ?? 5,
    social: parsed.social?.score ?? 5,
    overall: 0,
  };
  scores.overall =
    (scores.composition + scores.emotion + scores.aesthetic + scores.social) / 4;

  return { scores, rawResponse: parsed };
}

export async function generateCaptionWithOpenAI(
  imageBase64: string,
  style: string = "casual",
  mimeType: string = "image/jpeg"
) {
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Generate a ${style} Instagram caption for this photo. Include: 1) An engaging caption (max 150 words), 2) 10-15 relevant hashtags, 3) 2-5 appropriate emojis. Return ONLY valid JSON: { "caption": "...", "hashtags": ["#tag1", "#tag2", ...], "emojis": ["emoji1", "emoji2", ...] }`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 1024,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0].message.content ?? "{}";
  return JSON.parse(text);
}

export function isOpenAIAVAILABLE(): boolean {
  return Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.length > 10);
}