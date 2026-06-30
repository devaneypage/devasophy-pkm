# Commonplace Kanban Editor Design Document

## 1. Introduction

This document outlines the design and architectural considerations for the new Commonplace Kanban editor, which will replace the existing Notebook and Library pages. The goal is to create a unified, visually intuitive interface for managing various knowledge artifacts, leveraging a card-based Kanban system and a consistent color-coded content taxonomy across the application.

## 2. Content Type Taxonomy and Color System

The Commonplace editor will support the following specialized content types, each with a unique color for visual distinction and consistent application throughout the site:

| Content Type    | Color       | Hex Code (Example) |
| :-------------- | :---------- | :----------------- |
| Research Notes  | Vermillion  | #E34234            |
| Bookmarks       | Grey        | #808080            |
| Ideas           | Bright Blue | #0096FF            |
| Quotes          | Yellow      | #FFFF00            |
| Books           | Green       | #008000            |
| Articles        | Orange      | #FFA500            |
| Glossary Terms  | Pink        | #FFC0CB            |
| Lists           | Violet      | #EE82EE            |

This color mapping will be applied to card borders, labels, filter options, and potentially other UI elements to provide a clear visual language for content categorization.

## 3. Kanban Editor Architecture

### 3.1. Core Structure

The Commonplace editor will be a Kanban board, where each column represents a stage or category (e.g., "Inbox," "Processing," "Archived," or user-defined columns). Each card within a column will represent a single Commonplace entry, specializing in one of the defined content types.

### 3.2. Card Specialization

Each card will be dedicated to a single content type. This approach allows for:

*   **Optimized Editing Interfaces**: Each content type can have a tailored editor. For example:
    *   **Research Notes**: Markdown editor with rich text capabilities, embedded images, and linked references.
    *   **Bookmarks**: Fields for URL, title, description, tags, and a screenshot preview.
    *   **Ideas**: Simple text field for the core idea, with optional fields for elaboration, linked concepts, and status.
    *   **Quotes**: Text field for the quote, source attribution, and tags.
    *   **Books**: Fields for title, author, ISBN, cover image, reading progress, and personal notes.
    *   **Articles**: Fields for URL, title, summary, and key takeaways.
    *   **Glossary Terms**: Term, definition, and related concepts.
    *   **Lists**: Ordered/unordered list editor with checkboxes and reordering capabilities.

*   **Consistent Data Model**: Simplifies data persistence and retrieval, as each card maps directly to a specific data structure.

### 3.3. Drag-and-Drop Functionality

Users will be able to drag and drop cards between columns to change their status or category. Card reordering within columns will also be supported.

### 3.4. Mood Boarding Integration

For content types like "Ideas" or "Research Notes" that might benefit from visual brainstorming, the card editor will support embedding images directly, allowing for a mood board-like experience within the specialized card.

### 3.5. List-Making and Storyboarding

"Lists" will have a dedicated editor. Storyboarding elements can be integrated within "Research Notes" or "Ideas" cards through embedded images, linked references, or structured markdown.

### 3.6. Bookmark Collecting

Dedicated "Bookmark" cards will provide a structured way to save and annotate web resources.

## 4. Database Schema Updates

To support the new Commonplace entries, a new `commonplace_entries` table will be introduced, replacing the need for separate `books` and `notebook_entries` tables. This table will be highly flexible to accommodate various content types.

```sql
CREATE TABLE commonplace_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'research_note', 'bookmark', 'idea', 'quote', 'book', 'article', 'glossary_term', 'list'
    title VARCHAR(255),
    content JSONB, -- Stores specialized content based on 'type'
    metadata JSONB, -- Stores additional metadata (e.g., URL for bookmarks, author for books)
    tags TEXT[],
    column_id UUID NOT NULL, -- References a new 'kanban_columns' table
    position INT NOT NULL, -- Order within the column
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kanban_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    position INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

Existing `books` and `notebook_entries` tables will be deprecated and their data will *not* be migrated, as per user request for a fresh start.

## 5. Architectural Considerations

### 5.1. Frontend Framework

The Kanban editor will be built using React, leveraging existing components from `shadcn/ui` and `Tailwind CSS` for a consistent look and feel. Drag-and-drop functionality will be implemented using a library like `react-beautiful-dnd` or `dnd-kit`.

### 5.2. Backend API

tRPC procedures will be created to handle CRUD operations for `commonplace_entries` and `kanban_columns`, including:

*   `commonplace.list`: Retrieve all entries for a user, optionally filtered by column or type.
*   `commonplace.get`: Retrieve a single entry.
*   `commonplace.create`: Create a new entry of a specific type.
*   `commonplace.update`: Update an existing entry, including content, metadata, column, and position.
*   `commonplace.delete`: Delete an entry.
*   `columns.list`: Retrieve Kanban columns for a user.
*   `columns.create`: Create a new Kanban column.
*   `columns.update`: Update a Kanban column (e.g., title, position).
*   `columns.delete`: Delete a Kanban column.

### 5.3. Global Color Taxonomy Integration

The defined color system will be implemented using CSS variables or Tailwind CSS custom properties, allowing for easy application and modification across the entire application. This will ensure that the visual language of content types is consistent in the Kanban editor, sidebar navigation, search results, and any other relevant UI components.

### 5.4. Replacing Legacy Pages

The new Commonplace editor will replace the existing `/notebook` and `/library` routes. The main navigation will be updated to point to the new Commonplace module.

## 6. Future Enhancements

*   **Sub-typing of Notes**: Implement "reading notes," "research notes," and "fun facts" as subtypes of "Research Notes."
*   **Advanced Filtering and Search**: Integrate content type and color-based filtering into global search.
*   **Collaboration Features**: Allow sharing of Commonplace boards or individual cards.
*   **Version History**: Track changes to cards for auditing and recovery.

## 7. Conclusion

This design provides a robust foundation for a highly flexible and visually intuitive Commonplace Kanban editor, aligning with the user's vision for a unified knowledge management system. The specialized card types and consistent color taxonomy will enhance usability and organization across the application.
