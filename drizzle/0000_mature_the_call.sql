CREATE TABLE `sermons` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`speaker` text NOT NULL,
	`sermon_date` text NOT NULL,
	`description` text,
	`media_url` text,
	`audio_key` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_content` (
	`id` integer PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `site_content_key_unique` ON `site_content` (`key`);