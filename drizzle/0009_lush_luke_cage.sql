CREATE TABLE `commonplace_boards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commonplace_boards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commonplace_columns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`boardId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`colorToken` varchar(50),
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commonplace_columns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commonplace_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`boardId` int NOT NULL,
	`columnId` int NOT NULL,
	`commonplace_entry_type` enum('research_note','bookmark','idea','quote','book','article','glossary_term','list') NOT NULL,
	`title` varchar(255) NOT NULL,
	`summary` text,
	`content` json,
	`metadata` json,
	`tags` text,
	`position` int NOT NULL DEFAULT 0,
	`isArchived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commonplace_entries_id` PRIMARY KEY(`id`)
);
