/*
  Warnings:

  - You are about to drop the column `Author` on the `Product` table. All the data in the column will be lost.
  - Added the required column `author` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "priceInCents" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "length" INTEGER NOT NULL,
    "isAvailabelForPurchase" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "reviews" TEXT NOT NULL,
    "Score" INTEGER NOT NULL
);
INSERT INTO "new_Product" ("Score", "category", "createdAt", "description", "filePath", "id", "imagePath", "isAvailabelForPurchase", "length", "name", "priceInCents", "reviews", "updatedAt") SELECT "Score", "category", "createdAt", "description", "filePath", "id", "imagePath", "isAvailabelForPurchase", "length", "name", "priceInCents", "reviews", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
