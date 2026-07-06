/*
  Warnings:

  - You are about to drop the `restaurantmembership` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `restaurantmembership` DROP FOREIGN KEY `RestaurantMembership_restaurantId_fkey`;

-- DropForeignKey
ALTER TABLE `restaurantmembership` DROP FOREIGN KEY `RestaurantMembership_userId_fkey`;

-- DropTable
DROP TABLE `restaurantmembership`;
