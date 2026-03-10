-- CreateEnum
CREATE TYPE "HomepageSection" AS ENUM (
  'HERO',
  'TRENDING',
  'FEATURED',
  'EDITORIAL_VANILLA',
  'EDITORIAL_ARABIC',
  'EDITORIAL_OFFICE_SAFE',
  'SEASONAL_SUMMER',
  'SEASONAL_WINTER'
);

-- CreateEnum
CREATE TYPE "HomepageCollectionType" AS ENUM ('FINDER_PRESET', 'CATALOG_ROUTE');

-- CreateTable
CREATE TABLE "PerfumeHomepagePlacement" (
    "id" SERIAL NOT NULL,
    "perfumeId" INTEGER NOT NULL,
    "section" "HomepageSection" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerfumeHomepagePlacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageCollection" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "href" TEXT NOT NULL,
    "type" "HomepageCollectionType" NOT NULL DEFAULT 'FINDER_PRESET',
    "isHomepageVisible" BOOLEAN NOT NULL DEFAULT false,
    "homepagePriority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomepageCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PerfumeHomepagePlacement_perfumeId_section_key" ON "PerfumeHomepagePlacement"("perfumeId", "section");

-- CreateIndex
CREATE INDEX "PerfumeHomepagePlacement_section_priority_idx" ON "PerfumeHomepagePlacement"("section", "priority");

-- CreateIndex
CREATE INDEX "PerfumeHomepagePlacement_perfumeId_idx" ON "PerfumeHomepagePlacement"("perfumeId");

-- CreateIndex
CREATE UNIQUE INDEX "HomepageCollection_slug_key" ON "HomepageCollection"("slug");

-- CreateIndex
CREATE INDEX "HomepageCollection_isHomepageVisible_homepagePriority_idx" ON "HomepageCollection"("isHomepageVisible", "homepagePriority");

-- AddForeignKey
ALTER TABLE "PerfumeHomepagePlacement" ADD CONSTRAINT "PerfumeHomepagePlacement_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
