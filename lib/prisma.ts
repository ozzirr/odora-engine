import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const isDatabaseConfigured =
  typeof process.env.DATABASE_URL === "string" && process.env.DATABASE_URL.length > 0;

function readPositiveIntEnv(name: string) {
  const raw = process.env[name]?.trim();

  if (!raw) {
    return undefined;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function getRuntimeDatabaseUrl() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    return undefined;
  }

  try {
    const url = new URL(raw);
    const isPostgres = url.protocol === "postgresql:" || url.protocol === "postgres:";
    const configuredConnectionLimit = readPositiveIntEnv("ODORA_DB_CONNECTION_LIMIT");
    const configuredPoolTimeout = readPositiveIntEnv("ODORA_DB_POOL_TIMEOUT");

    if (!isPostgres) {
      return raw;
    }

    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", String(configuredConnectionLimit ?? 1));
    }

    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", String(configuredPoolTimeout ?? 20));
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
