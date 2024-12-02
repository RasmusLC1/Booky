-- CreateTable
CREATE TABLE "Product" (
    "ID" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "pricePaidInCents" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isAvailabelForPurchase" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "ID" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pricePaidInCents" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" DATETIME NOT NULL,
    "userID" TEXT NOT NULL,
    "productID" TEXT NOT NULL,
    CONSTRAINT "Order_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User" ("ID") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Order_productID_fkey" FOREIGN KEY ("productID") REFERENCES "Product" ("ID") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DownloadVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productID" TEXT NOT NULL,
    CONSTRAINT "DownloadVerification_productID_fkey" FOREIGN KEY ("productID") REFERENCES "Product" ("ID") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
