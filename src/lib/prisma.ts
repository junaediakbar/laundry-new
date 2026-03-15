import 'server-only';

import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';

import { normalizeDatabaseUrl } from '@/lib/database-url';

if (!process.env.DATABASE_URL) {
  loadEnvConfig(process.cwd());
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL
  ? normalizeDatabaseUrl(process.env.DATABASE_URL)
  : undefined;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
    datasources: databaseUrl
      ? {
          db: {
            url: databaseUrl,
          },
        }
      : undefined,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
