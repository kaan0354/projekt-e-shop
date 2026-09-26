-- Datenbankstruktur für das Webshop-Projekt
-- Erstellt die Datenbank und alle vom Backend benötigten Tabellen.
-- Zusätzlich werden drei Beispielprodukte für die Demonstration des Shops angelegt.
-- Es werden keine Benutzer-, Bestell- oder sonstigen Nutzdaten eingefügt.

CREATE DATABASE IF NOT EXISTS `webshop`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;

USE `webshop`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `cart_items`;
DROP TABLE IF EXISTS `email_verification_tokens`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `password_reset_tokens`;
DROP TABLE IF EXISTS `product_images`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `withdrawals`;

SET FOREIGN_KEY_CHECKS = 1;

-- Benutzerkonten
CREATE TABLE `users` (
    `id` int NOT NULL AUTO_INCREMENT,
    `username` varchar(100) NOT NULL,
    `email` varchar(255) NOT NULL,
    `password` varchar(255) NOT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `role` varchar(20) NOT NULL DEFAULT 'customer',
    `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
    `email_verified` tinyint(1) NOT NULL DEFAULT '0',
    PRIMARY KEY (`id`),
    UNIQUE KEY `username` (`username`),
    UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Produkte
CREATE TABLE `products` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `description` text,
    `price` decimal(10,2) NOT NULL,
    `image` varchar(255) DEFAULT NULL,
    `stock` int NOT NULL DEFAULT '0',
    `is_available` tinyint(1) NOT NULL DEFAULT '1',
    `is_archived` tinyint(1) NOT NULL DEFAULT '0',
    `show_on_homepage` tinyint(1) NOT NULL DEFAULT '0',
    `homepage_position` int DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Warenkorbpositionen
CREATE TABLE `cart_items` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_id` int NOT NULL,
    `product_id` int NOT NULL,
    `quantity` int NOT NULL DEFAULT '1',
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_cart_product` (`user_id`, `product_id`),
    KEY `product_id` (`product_id`),
    CONSTRAINT `cart_items_ibfk_1`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `cart_items_ibfk_2`
        FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tokens zur E-Mail-Verifizierung
CREATE TABLE `email_verification_tokens` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_id` int NOT NULL,
    `token_hash` varchar(64) NOT NULL,
    `expires_at` datetime NOT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_user` (`user_id`),
    UNIQUE KEY `unique_token` (`token_hash`),
    CONSTRAINT `email_verification_user_fk`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Bestellungen
CREATE TABLE `orders` (
    `id` int NOT NULL AUTO_INCREMENT,
    `order_number` varchar(50) DEFAULT NULL,
    `user_id` int NOT NULL,
    `total` decimal(10,2) NOT NULL,
    `status` varchar(50) NOT NULL DEFAULT 'offen',
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `full_name` varchar(255) DEFAULT NULL,
    `street` varchar(255) DEFAULT NULL,
    `postal_code` varchar(20) DEFAULT NULL,
    `city` varchar(100) DEFAULT NULL,
    `email` varchar(255) DEFAULT NULL,
    `paypal_order_id` varchar(100) DEFAULT NULL,
    `invoice_number` varchar(50) DEFAULT NULL,
    `payment_method` varchar(30) NOT NULL DEFAULT 'paypal',
    `payment_status` varchar(30) NOT NULL DEFAULT 'paid',
    PRIMARY KEY (`id`),
    UNIQUE KEY `order_number` (`order_number`),
    UNIQUE KEY `paypal_order_id` (`paypal_order_id`),
    UNIQUE KEY `invoice_number` (`invoice_number`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `orders_ibfk_1`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Einzelne Positionen einer Bestellung
CREATE TABLE `order_items` (
    `id` int NOT NULL AUTO_INCREMENT,
    `order_id` int NOT NULL,
    `product_id` int NOT NULL,
    `quantity` int NOT NULL,
    `unit_price` decimal(10,2) NOT NULL,
    `product_name` varchar(255) DEFAULT NULL,
    `product_image` varchar(500) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `order_id` (`order_id`),
    KEY `product_id` (`product_id`),
    CONSTRAINT `order_items_ibfk_1`
        FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
    CONSTRAINT `order_items_ibfk_2`
        FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tokens zum Zurücksetzen von Passwörtern
CREATE TABLE `password_reset_tokens` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_id` int NOT NULL,
    `token_hash` varchar(255) NOT NULL,
    `expires_at` datetime NOT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `password_reset_tokens_ibfk_1`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Zusätzliche Produktbilder
CREATE TABLE `product_images` (
    `id` int NOT NULL AUTO_INCREMENT,
    `product_id` int NOT NULL,
    `image_url` varchar(500) NOT NULL,
    `sort_order` int NOT NULL DEFAULT '0',
    PRIMARY KEY (`id`),
    KEY `product_images_ibfk_1` (`product_id`),
    CONSTRAINT `product_images_ibfk_1`
        FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Eingegangene Widerrufe
CREATE TABLE `withdrawals` (
    `id` int NOT NULL AUTO_INCREMENT,
    `full_name` varchar(255) NOT NULL,
    `email` varchar(255) NOT NULL,
    `order_number` varchar(50) NOT NULL,
    `received_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Beispielprodukte
INSERT INTO `products`
    (`id`, `name`, `description`, `price`, `image`, `stock`,
     `is_available`, `is_archived`, `show_on_homepage`, `homepage_position`)
VALUES
    (
        1,
        'Blaues Werkstück',
        'Ein blaues Werkstück mit einer sauberen Bohrung in der Mitte und zwei Frästaschen.',
        0.50,
        'img/blau.png',
        10,
        1,
        0,
        1,
        1
    ),
    (
        2,
        'Rotes Werkstück',
        'Ein rotes Werkstück mit zwei Frästaschen.',
        0.50,
        'img/rot.png',
        10,
        1,
        0,
        1,
        2
    ),
    (
        3,
        'Weißes Werkstück',
        'Ein weißes Werkstück mit einer Bohrung in der Mitte.',
        0.50,
        'img/weiß.png',
        10,
        1,
        0,
        1,
        3
    );