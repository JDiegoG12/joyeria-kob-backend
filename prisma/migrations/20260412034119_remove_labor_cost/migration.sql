/*
  Warnings:

  - You are about to drop the column `labor_cost` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `default_labor_cost` on the `system_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `products` DROP COLUMN `labor_cost`;

-- AlterTable
ALTER TABLE `system_settings` DROP COLUMN `default_labor_cost`;
