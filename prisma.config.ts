import "dotenv/config";
import { defineConfig } from "prisma/config";

const prismaCliUrl = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();

export default defineConfig({
  schema: "prisma/schema.prisma",
  ...(prismaCliUrl
    ? {
        datasource: {
          url: prismaCliUrl,
        },
      }
    : {}),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
