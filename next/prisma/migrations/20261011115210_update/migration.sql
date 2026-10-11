/*
  Warnings:

  - You are about to drop the column `folderId` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `Folder` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[parentFolderId,name]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[parentFolderId,name]` on the table `Folder` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `parentFolderId` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `File` DROP FOREIGN KEY `File_folderId_fkey`;

-- DropForeignKey
ALTER TABLE `Folder` DROP FOREIGN KEY `Folder_parentId_fkey`;

-- DropIndex
DROP INDEX `File_folderId_idx` ON `File`;

-- DropIndex
DROP INDEX `File_folderId_name_key` ON `File`;

-- DropIndex
DROP INDEX `Folder_parentId_idx` ON `Folder`;

-- DropIndex
DROP INDEX `Folder_parentId_name_key` ON `Folder`;

-- AlterTable
ALTER TABLE `File` DROP COLUMN `folderId`,
    ADD COLUMN `parentFolderId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Folder` DROP COLUMN `parentId`,
    ADD COLUMN `parentFolderId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `File_parentFolderId_idx` ON `File`(`parentFolderId`);

-- CreateIndex
CREATE UNIQUE INDEX `File_parentFolderId_name_key` ON `File`(`parentFolderId`, `name`);

-- CreateIndex
CREATE INDEX `Folder_parentFolderId_idx` ON `Folder`(`parentFolderId`);

-- CreateIndex
CREATE UNIQUE INDEX `Folder_parentFolderId_name_key` ON `Folder`(`parentFolderId`, `name`);

-- AddForeignKey
ALTER TABLE `Folder` ADD CONSTRAINT `Folder_parentFolderId_fkey` FOREIGN KEY (`parentFolderId`) REFERENCES `Folder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `File` ADD CONSTRAINT `File_parentFolderId_fkey` FOREIGN KEY (`parentFolderId`) REFERENCES `Folder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
