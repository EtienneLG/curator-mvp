-- CreateTable
CREATE TABLE "MediaItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "title" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INBOX',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "MediaItem_status_createdAt_idx" ON "MediaItem"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MediaItem_status_category_createdAt_idx" ON "MediaItem"("status", "category", "createdAt");
