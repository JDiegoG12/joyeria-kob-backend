-- CreateTable
CREATE TABLE `featured_products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` CHAR(36) NOT NULL,
    `position` INTEGER NOT NULL,

    UNIQUE INDEX `featured_products_product_id_key`(`product_id`),
    UNIQUE INDEX `featured_products_position_key`(`position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `featured_products` ADD CONSTRAINT `featured_products_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
