CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int,
	`uuid` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text,
	`project` varchar(255),
	`folder` varchar(255),
	`status` enum('draft','in_progress','completed','archived') DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `documents_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `entry_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entryType` enum('notebook','lexicon','document') NOT NULL,
	`entryId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `entry_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `export_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exportType` enum('notebook_markdown','notebook_json','lexicon_markdown','lexicon_json','document_markdown','full_backup') NOT NULL,
	`fileName` varchar(255),
	`recordCount` int,
	`fileSize` int,
	`status` enum('pending','processing','completed','failed') DEFAULT 'pending',
	`downloadUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `export_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `import_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`importType` enum('notebook_json','notebook_csv','lexicon_json','lexicon_csv') NOT NULL,
	`fileName` varchar(255),
	`totalRecords` int,
	`successfulRecords` int,
	`failedRecords` int,
	`status` enum('pending','processing','completed','failed') DEFAULT 'pending',
	`errorLog` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `import_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lexicon_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int,
	`term` varchar(255) NOT NULL,
	`partOfSpeech` varchar(100),
	`definition` text,
	`etymology` text,
	`origin` varchar(255),
	`sourceType` varchar(100),
	`imageNum` varchar(50),
	`notes` text,
	`dateAdded` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lexicon_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notebook_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int,
	`uuid` varchar(64) NOT NULL,
	`text` text NOT NULL,
	`author` varchar(255),
	`work` varchar(255),
	`sourceType` varchar(100),
	`location` varchar(255),
	`note` text,
	`tags` text,
	`collections` varchar(255),
	`favorite` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notebook_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `notebook_entries_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `search_index` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entryType` enum('notebook','lexicon','document') NOT NULL,
	`entryId` int NOT NULL,
	`title` varchar(255),
	`content` text,
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `search_index_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `semantic_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceType` enum('notebook','lexicon','document') NOT NULL,
	`sourceId` int NOT NULL,
	`targetType` enum('notebook','lexicon','document') NOT NULL,
	`targetId` int NOT NULL,
	`linkType` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `semantic_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`color` varchar(7),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taxonomy_areas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`areaNumber` int NOT NULL,
	`areaName` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taxonomy_areas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taxonomy_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`areaId` int NOT NULL,
	`categoryNumber` varchar(10) NOT NULL,
	`categoryName` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taxonomy_categories_id` PRIMARY KEY(`id`)
);
