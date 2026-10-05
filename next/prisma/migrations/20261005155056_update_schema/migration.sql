/*
  Warnings:

  - The primary key for the `VisitedFolder` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `dirPath` on the `VisitedFolder` table. All the data in the column will be lost.
  - You are about to drop the column `lastViewedAt` on the `VisitedFolder` table. All the data in the column will be lost.
  - You are about to drop the `Favorite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FolderMeta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Media` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MediaTag` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `folderId` to the `VisitedFolder` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Favorite` DROP FOREIGN KEY `Favorite_mediaId_fkey`;

-- DropForeignKey
ALTER TABLE `Favorite` DROP FOREIGN KEY `Favorite_userId_fkey`;

-- DropForeignKey
ALTER TABLE `MediaTag` DROP FOREIGN KEY `MediaTag_mediaId_fkey`;

-- DropForeignKey
ALTER TABLE `MediaTag` DROP FOREIGN KEY `MediaTag_tagId_fkey`;

-- DropForeignKey
ALTER TABLE `VisitedFolder` DROP FOREIGN KEY `VisitedFolder_userId_fkey`;

-- DropIndex
DROP INDEX `VisitedFolder_userId_isPinned_lastViewedAt_idx` ON `VisitedFolder`;

-- AlterTable
ALTER TABLE `VisitedFolder` DROP PRIMARY KEY,
    DROP COLUMN `dirPath`,
    DROP COLUMN `lastViewedAt`,
    ADD COLUMN `folderId` VARCHAR(191) NOT NULL,
    ADD COLUMN `visitedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD PRIMARY KEY (`userId`, `folderId`);

-- DropTable
DROP TABLE `Favorite`;

-- DropTable
DROP TABLE `FolderMeta`;

-- DropTable
DROP TABLE `Media`;

-- DropTable
DROP TABLE `MediaTag`;

-- CreateTable
CREATE TABLE `UserFileFavorite` (
    `userId` VARCHAR(191) NOT NULL,
    `fileId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `rating` INTEGER NULL,

    INDEX `UserFileFavorite_userId_idx`(`userId`),
    INDEX `UserFileFavorite_fileId_idx`(`fileId`),
    PRIMARY KEY (`userId`, `fileId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Folder` (
    `id` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `previewFileId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `name` VARCHAR(191) NOT NULL,
    `totalSize` BIGINT NOT NULL DEFAULT 0,
    `fileCount` INTEGER NOT NULL DEFAULT 0,

    INDEX `Folder_parentId_idx`(`parentId`),
    UNIQUE INDEX `Folder_parentId_name_key`(`parentId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `File` (
    `id` VARCHAR(191) NOT NULL,
    `folderId` VARCHAR(191) NOT NULL,
    `previewFileId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `name` VARCHAR(191) NOT NULL,
    `mtime` DATETIME(3) NOT NULL,
    `size` BIGINT NOT NULL,
    `type` ENUM('text', 'binary', 'video', 'audio', 'image') NULL,

    INDEX `File_folderId_idx`(`folderId`),
    INDEX `File_mtime_idx`(`mtime`),
    UNIQUE INDEX `File_folderId_name_key`(`folderId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FileTag` (
    `fileId` VARCHAR(191) NOT NULL,
    `tagId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FileTag_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`fileId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `VisitedFolder_userId_isPinned_visitedAt_idx` ON `VisitedFolder`(`userId`, `isPinned`, `visitedAt`);

-- AddForeignKey
ALTER TABLE `VisitedFolder` ADD CONSTRAINT `VisitedFolder_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserFileFavorite` ADD CONSTRAINT `UserFileFavorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserFileFavorite` ADD CONSTRAINT `UserFileFavorite_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `File`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Folder` ADD CONSTRAINT `Folder_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Folder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `File` ADD CONSTRAINT `File_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileTag` ADD CONSTRAINT `FileTag_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `File`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileTag` ADD CONSTRAINT `FileTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
