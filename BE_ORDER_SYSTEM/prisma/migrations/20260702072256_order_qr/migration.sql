-- AlterTable
ALTER TABLE `category` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `orderitem` ADD COLUMN `details` JSON NULL;

-- AlterTable
ALTER TABLE `table` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `refreshToken` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Table` ADD CONSTRAINT `Table_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
