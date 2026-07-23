ALTER TABLE `sermons` ADD `legacy_url` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `sermons_legacy_url_unique` ON `sermons` (`legacy_url`);
--> statement-breakpoint
CREATE TABLE `content_entries` (
	`id` integer PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`slug` text NOT NULL,
	`eyebrow` text,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_entries_slug_unique` ON `content_entries` (`slug`);
