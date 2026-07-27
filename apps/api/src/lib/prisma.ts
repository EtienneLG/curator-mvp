import { PrismaClient } from '@prisma/client';

// Single PrismaClient instance for the app lifetime. All DB access must go through
// repositories — never import this directly into handlers or services.
export const prisma = new PrismaClient();

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
