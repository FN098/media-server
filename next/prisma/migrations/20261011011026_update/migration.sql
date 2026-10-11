/*
  Warnings:

  - You are about to drop the column `createdAt` on the `UserFileFavorite` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `UserFileFavorite` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `UserFileFavorite` DROP COLUMN `createdAt`,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `UserFolderFavorite` (
    `userId` VARCHAR(191) NOT NULL,
    `folderId` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserFolderFavorite_folderId_idx`(`folderId`),
    PRIMARY KEY (`userId`, `folderId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserFolderFavorite` ADD CONSTRAINT `UserFolderFavorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserFolderFavorite` ADD CONSTRAINT `UserFolderFavorite_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
