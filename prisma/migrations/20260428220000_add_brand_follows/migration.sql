-- CreateTable
CREATE TABLE "BrandFollow" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "brandId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastNotifiedAt" TIMESTAMP(3),

    CONSTRAINT "BrandFollow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrandFollow_userId_brandId_key" ON "BrandFollow"("userId", "brandId");

-- CreateIndex
CREATE INDEX "BrandFollow_brandId_idx" ON "BrandFollow"("brandId");

-- CreateIndex
CREATE INDEX "BrandFollow_userId_idx" ON "BrandFollow"("userId");

-- AddForeignKey
ALTER TABLE "BrandFollow" ADD CONSTRAINT "BrandFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandFollow" ADD CONSTRAINT "BrandFollow_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
