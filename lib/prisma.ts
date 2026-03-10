import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const isDatabaseConfigured =
  typeof process.env.DATABASE_URL === "string" && process.env.DATABASE_URL.length > 0;

function getRuntimeDatabaseUrl() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    return undefined;
  }

  try {
    const url = new URL(raw);
    const isPostgres = url.protocol === "postgresql:" || url.protocol === "postgres:";

    if (!isPostgres) {
      return raw;
    }

    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "1");
    }

    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "20");
    }

    return url.toString();
  } catch {
    return raw;
  }
}

function createPrismaClient() {
  const runtimeUrl = getRuntimeDatabaseUrl();

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    ...(runtimeUrl
      ? {
          datasources: {
            db: {
              url: runtimeUrl,
            },
          },
        }
      : {}),
  });
}

const prismaClient = isDatabaseConfigured
  ? globalForPrisma.prisma ?? createPrismaClient()
  : undefined;

if (prismaClient && !globalForPrisma.prisma) {
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
