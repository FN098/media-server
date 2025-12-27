/*
  Warnings:

  - You are about to drop the `RecentFolder` table. If the table is not empty, all the data it contains will be lost.

*/
-- -- DropForeignKey
-- ALTER TABLE `RecentFolder` DROP FOREIGN KEY `RecentFolder_userId_fkey`;

-- -- DropTable
-- DROP TABLE `RecentFolder`;

-- -- CreateTable
-- CREATE TABLE `VisitedFolder` (
--     `userId` VARCHAR(191) NOT NULL,
--     `dirPath` VARCHAR(191) NOT NULL,
--     `lastViewedAt` DATETIME(3) NOT NULL,

--     INDEX `VisitedFolder_userId_lastViewedAt_idx`(`userId`, `lastViewedAt`),
--     PRIMARY KEY (`userId`, `dirPath`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- AddForeignKey
-- ALTER TABLE `VisitedFolder` ADD CONSTRAINT `VisitedFolder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


-- NOTE: 上記は prisma が自動で作成したSQLだが、テーブルドロップではなくリネームだけでいいので、以下のように書き換える

-- Rename table
RENAME TABLE `RecentFolder` TO `VisitedFolder`;

-- Rename index (MySQL 8.0+)
ALTER TABLE `VisitedFolder`
  RENAME INDEX `RecentFolder_userId_lastViewedAt_idx`
  TO `VisitedFolder_userId_lastViewedAt_idx`;

-- Rename foreign key（名前が気になるなら）
ALTER TABLE `VisitedFolder`
  DROP FOREIGN KEY `RecentFolder_userId_fkey`,
  ADD CONSTRAINT `VisitedFolder_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

