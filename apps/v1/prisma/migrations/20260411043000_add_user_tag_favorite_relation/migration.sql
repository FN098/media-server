/*
  Warnings:

  - You are about to drop the column `isFavorite` on the `Tag` table. All the data in the column will be lost.

*/
-- -- DropIndex
-- DROP INDEX `Tag_isFavorite_idx` ON `Tag`;

-- -- AlterTable
-- ALTER TABLE `Tag` DROP COLUMN `isFavorite`;

-- -- CreateTable
-- CREATE TABLE `UserTagFavorite` (
--     `userId` VARCHAR(191) NOT NULL,
--     `tagId` VARCHAR(191) NOT NULL,
--     `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

--     INDEX `UserTagFavorite_userId_idx`(`userId`),
--     PRIMARY KEY (`userId`, `tagId`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- AddForeignKey
-- ALTER TABLE `UserTagFavorite` ADD CONSTRAINT `UserTagFavorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `UserTagFavorite` ADD CONSTRAINT `UserTagFavorite_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;




-- 上記をもとに、マイグレーション修正

-- 1. 新しいテーブルを作成
CREATE TABLE `UserTagFavorite` (
    `userId` VARCHAR(191) NOT NULL,
    `tagId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserTagFavorite_userId_idx`(`userId`),
    PRIMARY KEY (`userId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. 外部キー制約の追加
ALTER TABLE `UserTagFavorite` ADD CONSTRAINT `UserTagFavorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `UserTagFavorite` ADD CONSTRAINT `UserTagFavorite_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ★ 3. データの移行 (カラム削除前に実行)
-- userId が 'admin' であることを前提に、お気に入りフラグが立っているタグを流し込む
INSERT INTO `UserTagFavorite` (`userId`, `tagId`, `createdAt`)
SELECT 'admin', `id`, NOW(3)
FROM `Tag`
WHERE `isFavorite` = true;

-- 4. 不要になったインデックスとカラムを削除
DROP INDEX `Tag_isFavorite_idx` ON `Tag`;
ALTER TABLE `Tag` DROP COLUMN `isFavorite`;
