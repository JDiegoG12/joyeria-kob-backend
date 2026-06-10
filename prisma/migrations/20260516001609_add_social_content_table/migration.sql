-- CreateTable
CREATE TABLE `social_contents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(100) NOT NULL,
    `image_url` VARCHAR(191) NOT NULL,
    `link` TEXT NOT NULL,
    `social_network` ENUM('YOUTUBE', 'TIKTOK', 'INSTAGRAM', 'FACEBOOK', 'OTHER') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `social_contents_social_network_idx`(`social_network`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
