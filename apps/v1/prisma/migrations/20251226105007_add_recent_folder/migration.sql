-- CreateTable
CREATE TABLE `RecentFolder` (
    `userId` VARCHAR(191) NOT NULL,
    `dirPath` VARCHAR(191) NOT NULL,
    `lastViewedAt` DATETIME(3) NOT NULL,

    INDEX `RecentFolder_userId_lastViewedAt_idx`(`userId`, `lastViewedAt`),
    PRIMARY KEY (`userId`, `dirPath`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RecentFolder` ADD CONSTRAINT `RecentFolder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
