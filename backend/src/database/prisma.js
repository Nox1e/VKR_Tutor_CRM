import { PrismaClient } from '@prisma/client';

const logLevel = process.env.NODE_ENV === 'production'
  ? ['warn', 'error']
  : ['warn', 'error'];

export const prisma = new PrismaClient({ log: logLevel });

export const initDatabase = async () => {
  // Validates the connection so the server fails fast if Postgres is down.
  await prisma.$queryRaw`SELECT 1`;
  return prisma;
};

export const closeDatabase = async () => {
  await prisma.$disconnect();
};
