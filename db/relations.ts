import { relations } from "drizzle-orm";
import {
  users,
  jdAreas,
  jdCategories,
  commonplaceEntries,
  quotations,
  lexiconEntries,
  researchDocuments,
  entryLinks,
  srCards,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  areas: many(jdAreas),
  categories: many(jdCategories),
  entries: many(commonplaceEntries),
  quotations: many(quotations),
  lexicon: many(lexiconEntries),
  documents: many(researchDocuments),
  links: many(entryLinks),
}));

export const jdAreasRelations = relations(jdAreas, ({ one, many }) => ({
  user: one(users, { fields: [jdAreas.userId], references: [users.id] }),
  categories: many(jdCategories),
}));

export const jdCategoriesRelations = relations(jdCategories, ({ one, many }) => ({
  user: one(users, { fields: [jdCategories.userId], references: [users.id] }),
  area: one(jdAreas, { fields: [jdCategories.areaId], references: [jdAreas.id] }),
  entries: many(commonplaceEntries),
}));

export const commonplaceEntriesRelations = relations(commonplaceEntries, ({ one }) => ({
  user: one(users, { fields: [commonplaceEntries.userId], references: [users.id] }),
  category: one(jdCategories, { fields: [commonplaceEntries.jdCategoryId], references: [jdCategories.id] }),
}));

export const quotationsRelations = relations(quotations, ({ one }) => ({
  user: one(users, { fields: [quotations.userId], references: [users.id] }),
}));

export const lexiconEntriesRelations = relations(lexiconEntries, ({ one, many }) => ({
  user: one(users, { fields: [lexiconEntries.userId], references: [users.id] }),
  cards: many(srCards),
}));

export const researchDocumentsRelations = relations(researchDocuments, ({ one }) => ({
  user: one(users, { fields: [researchDocuments.userId], references: [users.id] }),
}));

export const entryLinksRelations = relations(entryLinks, ({ one }) => ({
  user: one(users, { fields: [entryLinks.userId], references: [users.id] }),
}));

export const srCardsRelations = relations(srCards, ({ one }) => ({
  user: one(users, { fields: [srCards.userId], references: [users.id] }),
  lexiconEntry: one(lexiconEntries, { fields: [srCards.lexiconId], references: [lexiconEntries.id] }),
}));
