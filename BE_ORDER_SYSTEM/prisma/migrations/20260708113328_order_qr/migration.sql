/*
  Warnings:

  - The values [delivered] on the enum `Order_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [done] on the enum `OrderItem_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `order` MODIFY `status` ENUM('pending', 'staffConfirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled') NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE `orderitem` MODIFY `status` ENUM('pending', 'staffConfirmed', 'preparing', 'ready', 'served', 'cancelled') NOT NULL DEFAULT 'pending';
