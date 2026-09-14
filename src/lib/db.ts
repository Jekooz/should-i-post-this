import { PrismaClient as _PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: _PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ??
  new _PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Default user helpers
export async function getOrCreateDefaultUser() {
  let user = await prisma.user.findFirst({
    include: { scoringWeights: true },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'default@example.com',
        primaryModel: 'claude-vision',
      },
      include: { scoringWeights: true },
    });
    // Create default scoring preferences
    if (!user.scoringWeights) {
      await prisma.scoringPreferences.create({
        data: { userId: user.id },
      });
      user = await prisma.user.findFirst({ include: { scoringWeights: true } }) as typeof user;
    }
  }
  return user;
}
