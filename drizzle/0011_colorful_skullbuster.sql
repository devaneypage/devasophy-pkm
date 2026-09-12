CREATE TABLE `dashboard_layout_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`panelOrder` json NOT NULL,
	`layoutVersion` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dashboard_layout_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `dashboard_layout_preferences_userId_unique` UNIQUE(`userId`)
);
