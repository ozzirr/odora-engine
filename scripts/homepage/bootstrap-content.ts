import { PrismaClient } from "@prisma/client";

import { bootstrapHomepageContent } from "./lib/bootstrap";

const prisma = new PrismaClient();

async function main() {
  await bootstrapHomepageContent(prisma, {
    logger: console,
    resetExisting: true,
  });
}

main()
  .catch((error) => {
    console.error("[homepage] bootstrap failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
