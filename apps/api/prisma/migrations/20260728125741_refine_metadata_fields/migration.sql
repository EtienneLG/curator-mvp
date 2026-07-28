-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MediaItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "title" TEXT,
    "category" TEXT,
    "year" INTEGER,
    "creator" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INBOX',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_MediaItem" ("category", "content", "createdAt", "id", "status", "title") SELECT "category", "content", "createdAt", "id", "status", "title" FROM "MediaItem";
DROP TABLE "MediaItem";
ALTER TABLE "new_MediaItem" RENAME TO "MediaItem";
CREATE INDEX "MediaItem_status_createdAt_idx" ON "MediaItem"("status", "createdAt");
CREATE INDEX "MediaItem_status_category_createdAt_idx" ON "MediaItem"("status", "category", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

