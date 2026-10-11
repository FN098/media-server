-- AlterTable
ALTER TABLE `File` ADD COLUMN `isLocked` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Folder` ADD COLUMN `isLocked` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `File_folderId_idx` ON `File`(`folderId`);

-- CreateIndex
CREATE INDEX `File_name_idx` ON `File`(`name`);

-- CreateIndex
CREATE INDEX `FileTag_fileId_idx` ON `FileTag`(`fileId`);

-- CreateIndex
CREATE INDEX `Folder_parentId_idx` ON `Folder`(`parentId`);

-- CreateIndex
CREATE INDEX `Folder_name_idx` ON `Folder`(`name`);

-- CreateIndex
CREATE INDEX `Tag_name_idx` ON `Tag`(`name`);
