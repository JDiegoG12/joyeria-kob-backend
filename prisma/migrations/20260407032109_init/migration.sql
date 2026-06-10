-- CreateTable
CREATE TABLE `products` (
    `id` CHAR(36) NOT NULL,
    `category_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `base_weight` DECIMAL(10, 2) NOT NULL,
    `stone_value` DECIMAL(10, 2) NOT NULL,
    `labor_cost` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('AVAILABLE', 'OUT_OF_STOCK', 'HIDDEN') NOT NULL DEFAULT 'AVAILABLE',
    `calculated_price` DECIMAL(10, 2) NOT NULL,
    `specifications` JSON NOT NULL,
    `images` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `products_category_id_idx`(`category_id`),
    INDEX `products_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `gold_price_per_gram` DECIMAL(10, 2) NOT NULL,
    `last_update` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
