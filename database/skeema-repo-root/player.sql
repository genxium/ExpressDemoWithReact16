CREATE TABLE `player` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `handle` varchar(64) NOT NULL,
  `created_at` bigint unsigned NOT NULL,
  `deleted_at` bigint unsigned DEFAULT NULL,
  `updated_at` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY uk_handle (`handle`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
