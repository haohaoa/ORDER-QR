-- USERS
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `role` ENUM('customer','service','kitchen','manager','admin') NOT NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(100) NULL,
    -- hợp đồng
    `contract_type` ENUM('trial','monthly','yearly','permanent') NOT NULL DEFAULT 'monthly',

    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
);

-- TABLES
CREATE TABLE `tables` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `qr_code` TEXT NOT NULL,
    `status` ENUM('empty','occupied') DEFAULT 'empty',
    PRIMARY KEY (`id`)
);

-- CATEGORIES
CREATE TABLE `categories` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `sort_order` INT DEFAULT 0,
    PRIMARY KEY (`id`)
);

-- MENU ITEMS
CREATE TABLE `menu_items` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10,2) NOT NULL,
    `available` BOOLEAN NOT NULL DEFAULT TRUE,
    `category_id` CHAR(36) NULL,
    PRIMARY KEY (`id`)
);

-- ORDERS
CREATE TABLE `orders` (
    `id` CHAR(36) NOT NULL,
    `table_id` CHAR(36) NOT NULL,
    `status` ENUM(
        'pending',
        'preparing',
        'ready',
        'delivered',
        'completed',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',
    `total_amount` DECIMAL(10,2) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
);

-- ORDER ITEMS
CREATE TABLE `order_items` (
    `id` CHAR(36) NOT NULL,
    `order_id` CHAR(36) NOT NULL,
    `menu_item_id` CHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `price` DECIMAL(10,2) NOT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `note` TEXT NULL,
    `status` ENUM(
        'pending',
        'preparing',
        'done',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',
    PRIMARY KEY (`id`)
);

-- PAYMENTS
CREATE TABLE `payments` (
    `id` CHAR(36) NOT NULL,
    `order_id` CHAR(36) NOT NULL,
    `method` ENUM('cash','bank','momo','vnpay') NOT NULL,
    `amount` DECIMAL(10,2) NOT NULL,
    `status` ENUM('pending','paid','failed') NOT NULL DEFAULT 'pending',
    `paid_at` TIMESTAMP NULL,
    `image` TEXT NULL,
    PRIMARY KEY (`id`)
);

-- IMAGE ITEMS
CREATE TABLE `image_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `menu_id` CHAR(36) NOT NULL,
    `image` TEXT NOT NULL,
    PRIMARY KEY (`id`)
);

-- OPTION ITEMS
CREATE TABLE `option_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `menu_id` CHAR(36) NOT NULL,
    `name` TEXT NOT NULL,
    `required` BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (`id`)
);

-- FOREIGN KEYS
ALTER TABLE `orders`
ADD CONSTRAINT `orders_table_id_foreign`
FOREIGN KEY (`table_id`) REFERENCES `tables`(`id`);

ALTER TABLE `order_items`
ADD CONSTRAINT `order_items_order_id_foreign`
FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`);

ALTER TABLE `order_items`
ADD CONSTRAINT `order_items_menu_item_id_foreign`
FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`);

ALTER TABLE `menu_items`
ADD CONSTRAINT `menu_items_category_id_foreign`
FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`);

ALTER TABLE `payments`
ADD CONSTRAINT `payments_order_id_foreign`
FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`);

ALTER TABLE `image_items`
ADD CONSTRAINT `image_items_menu_id_foreign`
FOREIGN KEY (`menu_id`) REFERENCES `menu_items`(`id`);

ALTER TABLE `option_items`
ADD CONSTRAINT `option_items_menu_id_foreign`
FOREIGN KEY (`menu_id`) REFERENCES `menu_items`(`id`);
