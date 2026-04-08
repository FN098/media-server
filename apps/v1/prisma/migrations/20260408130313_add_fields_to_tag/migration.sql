-- AlterTable
ALTER TABLE `Tag` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isFavorite` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `kana` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Tag_kana_idx` ON `Tag`(`kana`);

-- CreateIndex
CREATE INDEX `Tag_isFavorite_idx` ON `Tag`(`isFavorite`);
