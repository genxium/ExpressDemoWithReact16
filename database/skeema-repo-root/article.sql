CREATE TABLE `article` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(64) NOT NULL,
  `category` smallint DEFAULT NULL,
  `content` text,
  `keyword_list` text,
  `writer_id` bigint unsigned NOT NULL,
  `author_suspended_reason` text,
  `state` smallint unsigned NOT NULL,
  `created_at` bigint unsigned NOT NULL,
  `updated_at` bigint unsigned NOT NULL,
  `deleted_at` bigint unsigned DEFAULT NULL,
  PRIMARY KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
