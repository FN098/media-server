-- AlterTable
ALTER TABLE `Media` ADD COLUMN `type` ENUM('video', 'audio', 'image') NULL;
