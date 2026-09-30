// Environment variable validation and typing
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DATABASE_URL: z.string().min(1),
  HUGGINGFACE_API_KEY: z.string().optional(),
  /** Vision-capable model on Hugging Face Inference Providers. */
  HUGGINGFACE_MODEL: z.string().default('meta-llama/Llama-4-Scout-17B-16E-Instruct'),
  HUGGINGFACE_BASE_URL: z.string().optional(),
  /** Per-request timeout for AI providers (ms). Bounds how long a hung gateway can wedge a handler. */
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  IMMICH_URL: z.string().optional(),
  IMMICH_API_KEY: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
});

// Cache the parsed env
let cachedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv(): z.infer<typeof envSchema> {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const missingVars = parsed.error.issues
      .filter((issue) => issue.code === 'invalid_type')
      .map((issue) => issue.path.join('.'))
      .join(', ');

    console.warn(`Missing or invalid environment variables: ${missingVars}`);
    console.warn('Using defaults where possible. Check your .env.local file.');

    // Return minimal config for development
    cachedEnv = {
      NODE_ENV: 'development',
      DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
      HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
      HUGGINGFACE_MODEL:
        process.env.HUGGINGFACE_MODEL || 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
      HUGGINGFACE_BASE_URL: process.env.HUGGINGFACE_BASE_URL,
      AI_REQUEST_TIMEOUT_MS: (() => {
        const n = Number(process.env.AI_REQUEST_TIMEOUT_MS);
        return Number.isFinite(n) && n > 0 ? Math.floor(n) : 30000;
      })(),
      IMMICH_URL: process.env.IMMICH_URL,
      IMMICH_API_KEY: process.env.IMMICH_API_KEY,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    };
  } else {
    cachedEnv = parsed.data;
  }

  return cachedEnv;
}

export const env = getEnv();

export function hasHuggingFaceKey(): boolean {
  return Boolean(env.HUGGINGFACE_API_KEY && env.HUGGINGFACE_API_KEY !== 'hf_...');
}

export function hasAnyAIProvider(): boolean {
  return hasHuggingFaceKey();
}