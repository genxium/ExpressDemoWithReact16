CREATE TABLE `attachment` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `state` smallint unsigned NOT NULL,
  `transcoding_failure_count` smallint unsigned NOT NULL DEFAULT 0,
  `max_transcoding_failure_count` smallint unsigned NOT NULL DEFAULT 0,
  `oss_bucket` varchar(32) NOT NULL,
  `oss_filepath` varchar(65) NOT NULL,
  `meta_type` smallint unsigned NOT NULL,
  `meta_id` bigint(20) unsigned DEFAULT NULL, 
  `owner_meta_type` smallint unsigned NOT NULL,
  `owner_meta_id` bigint unsigned NOT NULL,
  `mime_type` varchar(32) DEFAULT NULL,
  `transcoding_profile` text DEFAULT NULL,
  `source_oss_attachment_id` bigint unsigned DEFAULT NULL,
  `created_at` bigint unsigned NOT NULL,
  `updated_at` bigint unsigned NOT NULL,
  `deleted_at` bigint unsigned DEFAULT NULL,
  PRIMARY KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
