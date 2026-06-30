CREATE TABLE `books` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`author` varchar(255),
	`coverColor` varchar(20) DEFAULT '#E84D20',
	`dateAdded` timestamp NOT NULL DEFAULT (now()),
	`rating` decimal(2,1),
	`readingProgress` int DEFAULT 0,
	`status` enum('reading','completed','want_to_read') DEFAULT 'want_to_read',
	`notes` text,
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `books_id` PRIMARY KEY(`id`)
);
