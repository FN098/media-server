/*
  Warnings:

  - Made the column `type` on table `File` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `File` MODIFY `type` ENUM('text', 'binary', 'video', 'audio', 'image') NOT NULL;
