CREATE TABLE `player_auth_binding` (
  `player_id` bigint unsigned NOT NULL,
  `channel` smallint unsigned NOT NULL,
  `auth_id_in_channel` varchar(128) NOT NULL,
  `created_at` bigint unsigned NOT NULL,
  `deleted_at` bigint unsigned DEFAULT NULL,
  `updated_at` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`player_id`, `channel`, `auth_id_in_channel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
