// @vitest-environment jsdom

import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import CategorySelect from "@/components/CategorySelect";
import Notebook from "@/pages/Notebook";
import Lexicon from "@/pages/Lexicon";

const mockState = vi.hoisted(() => ({
  taxonomyTree: [
    {
      id: 30,
      areaNumber: 30,
      areaName: "QUOTATIONS & EXCERPTS",
      categories: [
        { id: 101, categoryNumber: "30.09", categoryName: "Miscellaneous Quotations" },
      ],
    },
    {
      id: 41,
      areaNumber: 41,
      areaName: "RESEARCH & ORIGINAL THINKING",
      categories: [
        { id: 102, categoryNumber: "41.01", categoryName: "Observations & Insights" },
      ],
    },
    {
      id: 10,
      areaNumber: 10,
      areaName: "LANGUAGE & VOCABULARY",
      categories: [{ id: 201, categoryNumber: "10.01", categoryName: "General Vocabulary Lists (A–M)" }],
    },
  ],
  notebookEntries: [
    {
      id: 1,
      uuid: "note-1",
      text: "Original quote",
      author: "Sophia",
      work: "Commonplace",
      sourceType: "Book",
      location: "p. 12",
      note: "Original note",
      tags: "wisdom",
      collections: "Primary",
      favorite: false,
      categoryId: 101,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  lexiconEntries: [
    {
      id: 2,
      term: "Aletheia",
      partOfSpeech: "noun",
      definition: "Truth disclosed",
      etymology: "Greek",
      origin: "Classical philosophy",
      sourceType: "Notebook",
      imageNum: "IMG-7",
      notes: "Existing lexical note",
      categoryId: 201,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  notebookCreateSpy: vi.fn(),
  notebookUpdateSpy: vi.fn(),
  lexiconUpdateSpy: vi.fn(),
  notebookRefetchSpy: vi.fn(),
  lexiconRefetchSpy: vi.fn(),
}));

vi.mock("uuid", () => ({
  v4: () => "fixed-uuid",
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      commonplace: {
        boards: { list: { invalidate: vi.fn() } },
        bootstrap: { invalidate: vi.fn() },
        entries: { list: { invalidate: vi.fn() } },
      },
    }),
    commonplace: {
      boards: {
        list: {
          useQuery: () => ({
            data: [{ id: 10, title: "Commonplace", description: "Working board", isDefault: true }],
            isLoading: false,
          }),
        },
        saveSnapshot: {
          useMutation: () => ({
            mutate: vi.fn(),
            isPending: false,
          }),
        },
      },
      bootstrap: {
        useQuery: () => ({
          data: {
            board: { id: 10, title: "Commonplace", description: "Working board", isDefault: true },
            columns: [
              { id: 1, title: "Inbox", colorToken: "grey", position: 0 },
              { id: 2, title: "Shaping", colorToken: "vermillion", position: 1 },
            ],
            entries: mockState.notebookEntries.map((entry) => ({
              id: entry.id,
              boardId: 10,
              columnId: 1,
              entryType: entry.sourceType === "General note" ? "research_note" : "quote",
              title: entry.text,
              summary: entry.note,
              content: { markdown: entry.text },
              metadata: {
                author: entry.author,
                work: entry.work,
                sourceType: entry.sourceType,
                location: entry.location,
                note: entry.note,
                collections: entry.collections,
                categoryId: entry.categoryId,
                uuid: entry.uuid,
              },
              tags: entry.tags,
              position: 0,
              isArchived: false,
            })),
          },
          isLoading: false,
        }),
      },
      columns: {
        create: {
          useMutation: () => ({
            mutate: vi.fn(),
            isPending: false,
          }),
        },
      },
      entries: {
        create: {
          useMutation: (options?: { onSuccess?: () => void }) => ({
            mutate: (payload: unknown) => {
              mockState.notebookCreateSpy(payload);
              options?.onSuccess?.();
            },
            isPending: false,
          }),
        },
        update: {
          useMutation: (options?: { onSuccess?: () => void }) => ({
            mutate: (payload: unknown) => {
              mockState.notebookUpdateSpy(payload);
              options?.onSuccess?.();
            },
            isPending: false,
          }),
        },
        delete: {
          useMutation: () => ({
            mutate: vi.fn(),
            isPending: false,
          }),
        },
        move: {
          useMutation: () => ({
            mutate: vi.fn(),
            isPending: false,
          }),
        },
      },
    },
    notebook: {
      list: {
        useQuery: () => ({
          data: mockState.notebookEntries,
          isLoading: false,
          refetch: mockState.notebookRefetchSpy,
        }),
      },
      create: {
        useMutation: (options?: { onSuccess?: () => void }) => ({
          mutate: (payload: unknown) => {
            mockState.notebookCreateSpy(payload);
            options?.onSuccess?.();
          },
          isPending: false,
        }),
      },
      update: {
        useMutation: (options?: { onSuccess?: () => void }) => ({
          mutate: (payload: unknown) => {
            mockState.notebookUpdateSpy(payload);
            options?.onSuccess?.();
          },
          isPending: false,
        }),
      },
      delete: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
    },
    lexicon: {
      list: {
        useQuery: () => ({
          data: mockState.lexiconEntries,
          isLoading: false,
          refetch: mockState.lexiconRefetchSpy,
        }),
      },
      create: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
      update: {
        useMutation: (options?: { onSuccess?: () => void }) => ({
          mutate: (payload: unknown) => {
            mockState.lexiconUpdateSpy(payload);
            options?.onSuccess?.();
          },
          isPending: false,
        }),
      },
      delete: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
    },
    taxonomy: {
      getTree: {
        useQuery: () => ({
          data: mockState.taxonomyTree,
        }),
      },
    },
    zettelkasten: {
      generateNotebookId: {
        useQuery: () => ({
          data: { zettelkastenId: "11-20250424-001" },
          isLoading: false,
        }),
      },
      generateLexiconId: {
        useQuery: () => ({
          data: { zettelkastenId: "21-20250424-001" },
          isLoading: false,
        }),
      },
    },
  },
}));

describe("PKM inline editing UI", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockState.notebookCreateSpy.mockReset();
    mockState.notebookUpdateSpy.mockReset();
    mockState.lexiconUpdateSpy.mockReset();
    mockState.notebookRefetchSpy.mockReset();
    mockState.lexiconRefetchSpy.mockReset();
  });

  it("converts category selection values into numeric ids", () => {
    const onChange = vi.fn();

    render(
      <CategorySelect
        label="Johnny Decimal category"
        value={101}
        tree={mockState.taxonomyTree}
        onChange={onChange}
      />,
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "102" } });
    expect(onChange).toHaveBeenCalledWith(102);

    fireEvent.change(select, { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("creates a research-note card from the notebook alias with the current commonplace editor", () => {
    render(<Notebook />);

    fireEvent.click(screen.getByRole("button", { name: /add a card to inbox/i }));

    expect(screen.getByRole("heading", { name: "Create card" })).toBeTruthy();
    expect(screen.getByText("Title")).toBeTruthy();
    expect(screen.getByText("Markdown body")).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("Name the card with a phrase you will recognize later"), {
      target: { value: "Working synthesis" },
    });
    fireEvent.change(screen.getByPlaceholderText("What makes this fragment worth preserving?"), {
      target: { value: "A summary worth preserving" },
    });
    fireEvent.change(screen.getByPlaceholderText("Draft in markdown, capture fragments, or shape the card into a polished record."), {
      target: { value: "Working synthesis about rhetoric and memory." },
    });
    fireEvent.change(screen.getByPlaceholderText("Add the source, context, or editorial frame"), {
      target: { value: "Rhetoric chapter notes" },
    });
    fireEvent.change(screen.getByPlaceholderText("Optional metadata to anchor recall"), {
      target: { value: "folio 7" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create card" }));

    expect(mockState.notebookCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        boardId: 10,
        columnId: 1,
        entryType: "research_note",
        title: "Working synthesis",
        summary: "A summary worth preserving",
        content: {
          markdown: "Working synthesis about rhetoric and memory.",
          context: "Rhetoric chapter notes",
          reference: "folio 7",
        },
      }),
    );
  });

  it("switches the notebook creator into quote mode with quote-specific labels and payload", () => {
    render(<Notebook />);

    fireEvent.click(screen.getByRole("button", { name: /add a card to inbox/i }));
    fireEvent.click(screen.getByRole("button", { name: "Quotes" }));

    expect(screen.getByText("Quote text")).toBeTruthy();
    expect(screen.getByText("Source")).toBeTruthy();
    expect(screen.getByText("Location")).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("Name the card with a phrase you will recognize later"), {
      target: { value: "Ars memoria fragment" },
    });
    fireEvent.change(screen.getByPlaceholderText("Draft in markdown, capture fragments, or shape the card into a polished record."), {
      target: { value: "Memory is the treasury and guardian of all things." },
    });
    fireEvent.change(screen.getByPlaceholderText("Add the source, context, or editorial frame"), {
      target: { value: "Cicero" },
    });
    fireEvent.change(screen.getByPlaceholderText("Optional metadata to anchor recall"), {
      target: { value: "De Oratore II.86" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create card" }));

    expect(mockState.notebookCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        entryType: "quote",
        title: "Ars memoria fragment",
        content: {
          text: "Memory is the treasury and guardian of all things.",
          source: "Cicero",
          location: "De Oratore II.86",
        },
      }),
    );
  });

  it("opens the notebook alias card editor and saves updated commonplace content", () => {
    const { container } = render(<Notebook />);

    fireEvent.click(screen.getByRole("button", { name: /Original quote/i }));

    const quoteFields = screen.getAllByDisplayValue("Original quote");
    fireEvent.change(quoteFields[0], {
      target: { value: "Revised quote" },
    });
    fireEvent.change(screen.getByDisplayValue("Original note"), {
      target: { value: "Revised summary" },
    });
    fireEvent.change(quoteFields[1], {
      target: { value: "Revised quote body" },
    });
    fireEvent.click(screen.getByText("Save changes"));

    expect(mockState.notebookUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        columnId: 1,
        entryType: "quote",
        title: "Revised quote",
        summary: "Revised summary",
        content: {
          text: "Revised quote body",
          source: "",
          location: "",
        },
      }),
    );
    expect(container.textContent).not.toContain("Save changes");
  });

  it("opens lexicon inline editing and allows cancel without submitting an update", () => {
    render(<Lexicon />);

    const card = screen.getByText("Aletheia").closest(".overflow-hidden") as HTMLElement;
    const editButton = within(card).getAllByRole("button")[0];
    fireEvent.click(editButton);

    expect(screen.getByDisplayValue("Aletheia")).toBeTruthy();
    expect(within(card).getByRole("combobox")).toBeTruthy();

    fireEvent.change(screen.getByDisplayValue("Aletheia"), {
      target: { value: "Aletheia revised" },
    });
    fireEvent.click(screen.getByText("Cancel"));

    expect(mockState.lexiconUpdateSpy).not.toHaveBeenCalled();
    expect(screen.queryByText("Save changes")).toBeNull();
  });
});
