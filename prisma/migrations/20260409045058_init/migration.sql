/*
  Warnings:

  - You are about to drop the column `stone_value` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `products` DROP COLUMN `stone_value`,
    ADD COLUMN `additional_value` DECIMAL(10, 2) NOT NULL DEFAULT 0;
