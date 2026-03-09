import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const isDatabaseConfigured =
  typeof process.env.DATABASE_URL === "string" && process.env.DATABASE_URL.length > 0;

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const prismaClient = isDatabaseConfigured
  ? globalForPrisma.prisma ?? createPrismaClient()
  : undefined;

if (process.env.NODE_ENV !== "production" && prismaClient) {
  globalForPrisma.prisma = prismaClient;
}

export const prisma =
  prismaClient ??
  (new Proxy({} as PrismaClient, {
    get() {
      throw new Error(
        "Prisma client unavailable: DATABASE_URL is not configured. Set DATABASE_URL for database-backed routes.",
      );
    },
  }) as PrismaClient);
