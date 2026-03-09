import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`SELECT 1`;
  console.log("Database connected:", result);
}

main().finally(() => prisma.$disconnect());
