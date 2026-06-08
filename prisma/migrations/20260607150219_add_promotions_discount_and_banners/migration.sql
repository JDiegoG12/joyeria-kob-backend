-- AlterTable
ALTER TABLE `products` ADD COLUMN `discount_value` DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `promo_banners` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(120) NULL,
    `subtitle` VARCHAR(200) NULL,
    `image_url` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL,
    `link_type` ENUM('PRODUCT', 'CATEGORY', 'NONE') NOT NULL DEFAULT 'NONE',
    `link_product_id` CHAR(36) NULL,
    `link_category_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `promo_banners_position_key`(`position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
