-- CreateTable
CREATE TABLE `gold_price_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `gold_price_per_gram` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `gold_price_history_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
