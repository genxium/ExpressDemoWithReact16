CREATE TABLE `role_login_cache` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_id` bigint unsigned NOT NULL,
  `role_name` varchar(32) DEFAULT NULL,
  `from_public_ip` varchar(128) DEFAULT NULL,
  `int_auth_token` varchar(64) NOT NULL,
  `meta_data` text DEFAULT NULL,
  `expires_at` bigint unsigned NOT NULL,
  `created_at` bigint unsigned NOT NULL,
  `updated_at` bigint unsigned NOT NULL,
  `deleted_at` bigint unsigned DEFAULT NULL,
  PRIMARY KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
