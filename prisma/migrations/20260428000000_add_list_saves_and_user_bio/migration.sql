ALTER TABLE "User" ADD COLUMN "bio" TEXT;

CREATE TABLE "PerfumeListSave" (
  "id" SERIAL NOT NULL,
  "userId" TEXT NOT NULL,
  "listId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PerfumeListSave_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PerfumeListSave_userId_listId_key" ON "PerfumeListSave"("userId", "listId");
CREATE INDEX "PerfumeListSave_listId_idx" ON "PerfumeListSave"("listId");
CREATE INDEX "PerfumeListSave_userId_idx" ON "PerfumeListSave"("userId");

ALTER TABLE "PerfumeListSave" ADD CONSTRAINT "PerfumeListSave_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PerfumeListSave" ADD CONSTRAINT "PerfumeListSave_listId_fkey"
  FOREIGN KEY ("listId") REFERENCES "PerfumeList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
