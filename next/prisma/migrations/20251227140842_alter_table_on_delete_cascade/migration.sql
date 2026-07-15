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
DROP INDEX `MediaTag_tagId_fkey` ON `MediaTag`;

-- AddForeignKey
ALTER TABLE `MediaTag` ADD CONSTRAINT `MediaTag_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `Media`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MediaTag` ADD CONSTRAINT `MediaTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `Media`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VisitedFolder` ADD CONSTRAINT `VisitedFolder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
