-- CreateTable
-- Note: This migration is intentionally non-destructive for existing DBs.
-- It uses `CREATE TABLE IF NOT EXISTS` to avoid breaking environments where
-- `payments` was already created via `prisma db push`.

CREATE TABLE IF NOT EXISTS `payments` (
    `id` VARCHAR(191) NOT NULL,
    `shop_id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `method` VARCHAR(50) NULL,
    `reference` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `created_by_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    INDEX `payments_shop_id_idx` (`shop_id`),
    INDEX `payments_order_id_idx` (`order_id`),
    INDEX `payments_created_at_idx` (`created_at`),

    CONSTRAINT `payments_shop_id_fkey`
      FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `payments_order_id_fkey`
      FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `payments_created_by_id_fkey`
      FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

