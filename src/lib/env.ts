// Environment variable validation and typing
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DATABASE_URL: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
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
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
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

export function hasAnthropicKey(): boolean {
  return Boolean(env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY !== 'sk-ant-...');
}

export function hasOpenAIKey(): boolean {
  return Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY !== 'sk-...');
}

export function hasAnyAIProvider(): boolean {
  return hasAnthropicKey() || hasOpenAIKey();
}