ALTER TABLE `lexicon_entries` ADD `zettelkasten_id` varchar(50);--> statement-breakpoint
ALTER TABLE `notebook_entries` ADD `zettelkasten_id` varchar(50);--> statement-breakpoint
ALTER TABLE `lexicon_entries` ADD CONSTRAINT `lexicon_entries_zettelkasten_id_unique` UNIQUE(`zettelkasten_id`);--> statement-breakpoint
ALTER TABLE `notebook_entries` ADD CONSTRAINT `notebook_entries_zettelkasten_id_unique` UNIQUE(`zettelkasten_id`);