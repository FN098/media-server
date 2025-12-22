/*
  Warnings:

  - Added the required column `fileMtime` to the `Media` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Media` ADD COLUMN `fileMtime` DATETIME(3) NOT NULL,
    ADD COLUMN `fileSize` BIGINT NULL;

-- CreateIndex
CREATE INDEX `Media_dirPath_idx` ON `Media`(`dirPath`);

-- CreateIndex
CREATE INDEX `Media_fileMtime_idx` ON `Media`(`fileMtime`);
