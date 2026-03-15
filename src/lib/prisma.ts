import 'server-only';

import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  loadEnvConfig(process.cwd());
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
