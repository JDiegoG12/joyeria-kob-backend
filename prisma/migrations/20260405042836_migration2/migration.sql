/*
  Warnings:

  - A unique constraint covering the columns `[parentId,name]` on the table `categories` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `categories_parentId_name_key` ON `categories`(`parentId`, `name`);
