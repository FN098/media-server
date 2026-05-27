-- DropForeignKey
ALTER TABLE `VisitedFolder` DROP FOREIGN KEY `VisitedFolder_userId_fkey`;

-- DropIndex
DROP INDEX `VisitedFolder_userId_lastViewedAt_idx` ON `VisitedFolder`;

-- AlterTable
ALTER TABLE `VisitedFolder` ADD COLUMN `isPinned` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `VisitedFolder_userId_isPinned_lastViewedAt_idx` ON `VisitedFolder`(`userId`, `isPinned`, `lastViewedAt`);

-- AddForeignKey
ALTER TABLE `VisitedFolder` ADD CONSTRAINT `VisitedFolder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
