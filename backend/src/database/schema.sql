-- Execute este script na base de dados configurada em MYSQL_DATABASE.
-- As tabelas seguem os nomes e colunas usados pelos Models e Repositories.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `email` VARCHAR(190) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('client', 'driver', 'admin') NOT NULL DEFAULT 'client',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `drivers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` INT UNSIGNED NOT NULL,
  `plate` VARCHAR(20) NOT NULL,
  `carModel` VARCHAR(120) NOT NULL,
  `status` ENUM('available', 'busy', 'offline') NOT NULL DEFAULT 'offline',
  `lat` DECIMAL(10, 7) NULL,
  `lng` DECIMAL(10, 7) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_drivers_userId` (`userId`),
  UNIQUE KEY `uk_drivers_plate` (`plate`),
  KEY `idx_drivers_status` (`status`),
  CONSTRAINT `fk_drivers_user`
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `chk_drivers_lat` CHECK (`lat` IS NULL OR (`lat` >= -90 AND `lat` <= 90)),
  CONSTRAINT `chk_drivers_lng` CHECK (`lng` IS NULL OR (`lng` >= -180 AND `lng` <= 180))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rides` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `clientId` INT UNSIGNED NOT NULL,
  `driverId` INT UNSIGNED NULL,
  `pickupLat` DECIMAL(10, 7) NOT NULL,
  `pickupLng` DECIMAL(10, 7) NOT NULL,
  `dropLat` DECIMAL(10, 7) NOT NULL,
  `dropLng` DECIMAL(10, 7) NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('requested', 'accepted', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'requested',
  `requested_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rides_clientId` (`clientId`),
  KEY `idx_rides_driverId` (`driverId`),
  KEY `idx_rides_status` (`status`),
  KEY `idx_rides_requested_at` (`requested_at`),
  CONSTRAINT `fk_rides_client`
    FOREIGN KEY (`clientId`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_rides_driver`
    FOREIGN KEY (`driverId`) REFERENCES `drivers` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `chk_rides_pickupLat` CHECK (`pickupLat` >= -90 AND `pickupLat` <= 90),
  CONSTRAINT `chk_rides_pickupLng` CHECK (`pickupLng` >= -180 AND `pickupLng` <= 180),
  CONSTRAINT `chk_rides_dropLat` CHECK (`dropLat` >= -90 AND `dropLat` <= 90),
  CONSTRAINT `chk_rides_dropLng` CHECK (`dropLng` >= -180 AND `dropLng` <= 180),
  CONSTRAINT `chk_rides_price` CHECK (`price` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Dados fake para desenvolvimento.
-- Senha em texto dos usuarios fake: 123456
INSERT INTO `users` (`name`, `phone`, `email`, `password`, `role`)
VALUES
  ('Ana Cliente', '+351910000001', 'ana.cliente@techmove.local', '$2b$12$E1Wc8OpyUwsibeCKbv2lOe9bm7qHVCEQ7icJDJsfZ3BO0fL2elqd6', 'client'),
  ('Bruno Cliente', '+351910000002', 'bruno.cliente@techmove.local', '$2b$12$E1Wc8OpyUwsibeCKbv2lOe9bm7qHVCEQ7icJDJsfZ3BO0fL2elqd6', 'client'),
  ('Joana Motorista', '+351920000001', 'joana.motorista@techmove.local', '$2b$12$E1Wc8OpyUwsibeCKbv2lOe9bm7qHVCEQ7icJDJsfZ3BO0fL2elqd6', 'driver'),
  ('Carlos Motorista', '+351920000002', 'carlos.motorista@techmove.local', '$2b$12$E1Wc8OpyUwsibeCKbv2lOe9bm7qHVCEQ7icJDJsfZ3BO0fL2elqd6', 'driver'),
  ('Admin TechMove', '+351930000001', 'admin@techmove.local', '$2b$12$E1Wc8OpyUwsibeCKbv2lOe9bm7qHVCEQ7icJDJsfZ3BO0fL2elqd6', 'admin')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `phone` = VALUES(`phone`),
  `password` = VALUES(`password`),
  `role` = VALUES(`role`);

SET @ana_cliente_id = (SELECT `id` FROM `users` WHERE `email` = 'ana.cliente@techmove.local' LIMIT 1);
SET @bruno_cliente_id = (SELECT `id` FROM `users` WHERE `email` = 'bruno.cliente@techmove.local' LIMIT 1);
SET @joana_user_id = (SELECT `id` FROM `users` WHERE `email` = 'joana.motorista@techmove.local' LIMIT 1);
SET @carlos_user_id = (SELECT `id` FROM `users` WHERE `email` = 'carlos.motorista@techmove.local' LIMIT 1);

INSERT INTO `drivers` (`userId`, `plate`, `carModel`, `status`, `lat`, `lng`)
VALUES
  (@joana_user_id, 'AA-11-BB', 'Toyota Corolla', 'available', 38.7223000, -9.1393000),
  (@carlos_user_id, 'CC-22-DD', 'Hyundai i30', 'offline', 38.7369000, -9.1427000)
ON DUPLICATE KEY UPDATE
  `userId` = VALUES(`userId`),
  `plate` = VALUES(`plate`),
  `carModel` = VALUES(`carModel`),
  `status` = VALUES(`status`),
  `lat` = VALUES(`lat`),
  `lng` = VALUES(`lng`);

SET @joana_driver_id = (SELECT `id` FROM `drivers` WHERE `userId` = @joana_user_id LIMIT 1);
SET @carlos_driver_id = (SELECT `id` FROM `drivers` WHERE `userId` = @carlos_user_id LIMIT 1);

INSERT INTO `rides` (`clientId`, `driverId`, `pickupLat`, `pickupLng`, `dropLat`, `dropLng`, `price`, `status`, `requested_at`)
SELECT @ana_cliente_id, @joana_driver_id, 38.7223000, -9.1393000, 38.7071000, -9.1355000, 8.50, 'completed', '2026-05-10 09:30:00'
WHERE @ana_cliente_id IS NOT NULL
  AND @joana_driver_id IS NOT NULL
  AND NOT EXISTS (
  SELECT 1 FROM `rides` WHERE `clientId` = @ana_cliente_id AND `requested_at` = '2026-05-10 09:30:00'
);

INSERT INTO `rides` (`clientId`, `driverId`, `pickupLat`, `pickupLng`, `dropLat`, `dropLng`, `price`, `status`, `requested_at`)
SELECT @bruno_cliente_id, @joana_driver_id, 38.7369000, -9.1427000, 38.7527000, -9.1847000, 12.75, 'in_progress', '2026-05-11 14:15:00'
WHERE @bruno_cliente_id IS NOT NULL
  AND @joana_driver_id IS NOT NULL
  AND NOT EXISTS (
  SELECT 1 FROM `rides` WHERE `clientId` = @bruno_cliente_id AND `requested_at` = '2026-05-11 14:15:00'
);

INSERT INTO `rides` (`clientId`, `driverId`, `pickupLat`, `pickupLng`, `dropLat`, `dropLng`, `price`, `status`, `requested_at`)
SELECT @ana_cliente_id, @carlos_driver_id, 38.7169000, -9.1399000, 38.7609000, -9.1286000, 15.20, 'accepted', '2026-05-12 10:00:00'
WHERE @ana_cliente_id IS NOT NULL
  AND @carlos_driver_id IS NOT NULL
  AND NOT EXISTS (
  SELECT 1 FROM `rides` WHERE `clientId` = @ana_cliente_id AND `requested_at` = '2026-05-12 10:00:00'
);

INSERT INTO `rides` (`clientId`, `driverId`, `pickupLat`, `pickupLng`, `dropLat`, `dropLng`, `price`, `status`, `requested_at`)
SELECT @bruno_cliente_id, NULL, 38.7249000, -9.1500000, 38.7452000, -9.1604000, 6.90, 'requested', '2026-05-12 11:00:00'
WHERE @bruno_cliente_id IS NOT NULL
  AND NOT EXISTS (
  SELECT 1 FROM `rides` WHERE `clientId` = @bruno_cliente_id AND `requested_at` = '2026-05-12 11:00:00'
);
