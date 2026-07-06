-- AlterTable
ALTER TABLE `user` ADD COLUMN `restaurantId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
