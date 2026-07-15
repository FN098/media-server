-- AlterTable
ALTER TABLE `Session` ADD COLUMN `impersonatedBy` TEXT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `banExpires` DATETIME(3) NULL,
    ADD COLUMN `banReason` TEXT NULL,
    ADD COLUMN `banned` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `role` TEXT NULL;
