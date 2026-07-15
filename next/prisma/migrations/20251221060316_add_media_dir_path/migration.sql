/*
  Warnings:

  - Added the required column `dirPath` to the `Media` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Media` ADD COLUMN `dirPath` VARCHAR(191) NOT NULL;
