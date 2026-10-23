-- AlterTable
ALTER TABLE `File` MODIFY `type` ENUM('text', 'binary', 'video', 'audio', 'image', 'archive') NOT NULL;
