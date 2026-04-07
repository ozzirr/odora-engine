import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

type AsyncOperationFactory<T> = () => Promise<T>;

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
    const defaultConnectionLimit = process.env.NODE_ENV === "development" ? 5 : 1;

    if (!isPostgres) {
      return raw;
    }

    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set(
        "connection_limit",
        String(configuredConnectionLimit ?? defaultConnectionLimit),
      );
    }

    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", String(configuredPoolTimeout ?? 20));
    }

    return url.toString();
  } catch {
    return raw;
  }
}

function getRuntimeDatabaseConnectionLimit(runtimeUrl: string | undefined) {
  if (!runtimeUrl) {
    return undefined;
  }

  try {
    const url = new URL(runtimeUrl);
    const isPostgres = url.protocol === "postgresql:" || url.protocol === "postgres:";

    if (!isPostgres) {
      return undefined;
    }

    const configuredConnectionLimit = readPositiveIntEnv("ODORA_DB_CONNECTION_LIMIT");

    if (configuredConnectionLimit) {
      return configuredConnectionLimit;
    }

    const parsedConnectionLimit = Number.parseInt(
      url.searchParams.get("connection_limit") ?? "",
      10,
    );

    return Number.isFinite(parsedConnectionLimit) && parsedConnectionLimit > 0
      ? parsedConnectionLimit
      : undefined;
  } catch {
    return undefined;
  }
}

const runtimeDatabaseUrl = getRuntimeDatabaseUrl();
const runtimeDatabaseConnectionLimit = getRuntimeDatabaseConnectionLimit(runtimeDatabaseUrl);
export const shouldSerializePrismaOperations =
  runtimeDatabaseConnectionLimit != null && runtimeDatabaseConnectionLimit <= 1;

export async function runPrismaOperations<const T extends readonly unknown[]>(
  factories: { [K in keyof T]: AsyncOperationFactory<T[K]> },
): Promise<T> {
  if (!shouldSerializePrismaOperations) {
    return Promise.all(factories.map((factory) => factory())) as unknown as Promise<T>;
  }

  const results: unknown[] = [];

  for (const factory of factories) {
    results.push(await factory());
  }

  return results as unknown as T;
}

function isRetryablePrismaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = (error as { name?: string }).name ?? "";
  const code = (error as { code?: string }).code ?? "";
  // PrismaClientInitializationError = can't connect (cold start)
  // P1001/P1002/P1008/P1017 = connection / timeout errors
  return (
    name === "PrismaClientInitializationError" ||
    code === "P1001" ||
    code === "P1002" ||
    code === "P1008" ||
    code === "P1017"
  );
}

export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  retries = 2,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && isRetryablePrismaError(error)) {
      await new Promise<void>((resolve) => setTimeout(resolve, 150));
      return withDatabaseRetry(operation, retries - 1);
    }
    throw error;
  }
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    ...(runtimeDatabaseUrl
      ? {
          datasources: {
            db: {
              url: runtimeDatabaseUrl,
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
