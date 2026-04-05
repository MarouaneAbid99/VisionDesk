-- AlterTable
ALTER TABLE `atelier_jobs` ADD COLUMN `blocked_reason` VARCHAR(255) NULL,
    ADD COLUMN `due_date` DATE NULL;

-- AlterTable
ALTER TABLE `lenses` ADD COLUMN `barcode` VARCHAR(100) NULL,
    ADD COLUMN `max_add` DECIMAL(4, 2) NULL,
    ADD COLUMN `max_cylinder` DECIMAL(5, 2) NULL,
    ADD COLUMN `max_sphere` DECIMAL(5, 2) NULL,
    ADD COLUMN `min_cylinder` DECIMAL(5, 2) NULL,
    ADD COLUMN `min_sphere` DECIMAL(5, 2) NULL;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `deposit` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `paid_at` DATETIME(3) NULL,
    ADD COLUMN `payment_status` ENUM('UNPAID', 'PARTIAL', 'PAID') NOT NULL DEFAULT 'UNPAID',
    ADD COLUMN `picked_up_at` DATETIME(3) NULL,
    ADD COLUMN `ready_at` DATETIME(3) NULL,
    MODIFY `status` ENUM('DRAFT', 'CONFIRMED', 'IN_ATELIER', 'READY', 'READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE `appointments` (
    `id` VARCHAR(191) NOT NULL,
    `shop_id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `created_by_id` VARCHAR(191) NOT NULL,
    `appointment_type` ENUM('EYE_EXAM', 'CONTACT_LENS', 'PICKUP', 'REPAIR', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `status` ENUM('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `scheduled_at` DATETIME(3) NOT NULL,
    `duration_minutes` INTEGER NOT NULL DEFAULT 30,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `appointments_shop_id_idx`(`shop_id`),
    INDEX `appointments_client_id_idx`(`client_id`),
    INDEX `appointments_scheduled_at_idx`(`scheduled_at`),
    INDEX `appointments_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `shop_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `type` ENUM('APPOINTMENT_SOON', 'APPOINTMENT_OVERDUE', 'ORDER_READY', 'ORDER_OVERDUE', 'LOW_STOCK', 'ATELIER_BLOCKED', 'ATELIER_URGENT') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `entity_type` VARCHAR(50) NULL,
    `entity_id` VARCHAR(191) NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_shop_id_idx`(`shop_id`),
    INDEX `notifications_user_id_idx`(`user_id`),
    INDEX `notifications_is_read_idx`(`is_read`),
    INDEX `notifications_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `atelier_jobs_shop_id_status_idx` ON `atelier_jobs`(`shop_id`, `status`);

-- CreateIndex
CREATE INDEX `atelier_jobs_due_date_idx` ON `atelier_jobs`(`due_date`);

-- CreateIndex
CREATE INDEX `clients_shop_id_is_active_idx` ON `clients`(`shop_id`, `is_active`);

-- CreateIndex
CREATE INDEX `clients_email_idx` ON `clients`(`email`);

-- CreateIndex
CREATE INDEX `frames_shop_id_is_active_idx` ON `frames`(`shop_id`, `is_active`);

-- CreateIndex
CREATE INDEX `lenses_shop_id_is_active_idx` ON `lenses`(`shop_id`, `is_active`);

-- CreateIndex
CREATE INDEX `orders_shop_id_status_idx` ON `orders`(`shop_id`, `status`);

-- CreateIndex
CREATE INDEX `orders_shop_id_created_at_idx` ON `orders`(`shop_id`, `created_at`);

-- CreateIndex
CREATE INDEX `orders_shop_id_payment_status_idx` ON `orders`(`shop_id`, `payment_status`);

-- CreateIndex
CREATE INDEX `orders_payment_status_idx` ON `orders`(`payment_status`);

-- CreateIndex
CREATE INDEX `orders_due_date_idx` ON `orders`(`due_date`);

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
