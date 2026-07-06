-- AlterTable
ALTER TABLE `user` ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `contractType` VARCHAR(191) NULL,
    ADD COLUMN `role` VARCHAR(191) NULL DEFAULT 'staff';
