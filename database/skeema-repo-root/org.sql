CREATE TABLE `org` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `handle` varchar(64) NOT NULL,
  `display_name` varchar(128) NOT NULL,
  `created_at` bigint unsigned NOT NULL,
  `deleted_at` bigint unsigned DEFAULT NULL,
  `updated_at` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
