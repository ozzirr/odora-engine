CREATE TYPE "PerfumeListVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT,
  "name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PerfumeList" (
  "id" SERIAL NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "visibility" "PerfumeListVisibility" NOT NULL DEFAULT 'PRIVATE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PerfumeList_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PerfumeListItem" (
  "id" SERIAL NOT NULL,
  "listId" INTEGER NOT NULL,
  "perfumeId" INTEGER NOT NULL,
  "note" TEXT,
  "position" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PerfumeListItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PerfumeList_userId_slug_key" ON "PerfumeList"("userId", "slug");
CREATE INDEX "PerfumeList_userId_idx" ON "PerfumeList"("userId");
CREATE INDEX "PerfumeList_visibility_idx" ON "PerfumeList"("visibility");

CREATE UNIQUE INDEX "PerfumeListItem_listId_perfumeId_key" ON "PerfumeListItem"("listId", "perfumeId");
CREATE INDEX "PerfumeListItem_perfumeId_idx" ON "PerfumeListItem"("perfumeId");
CREATE INDEX "PerfumeListItem_listId_position_idx" ON "PerfumeListItem"("listId", "position");

ALTER TABLE "PerfumeList"
ADD CONSTRAINT "PerfumeList_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PerfumeListItem"
ADD CONSTRAINT "PerfumeListItem_listId_fkey"
FOREIGN KEY ("listId") REFERENCES "PerfumeList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PerfumeListItem"
ADD CONSTRAINT "PerfumeListItem_perfumeId_fkey"
FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
