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
      id: 10,
      areaNumber: 10,
      areaName: "Commonplace Notebook",
      categories: [
        { id: 101, categoryNumber: "11", categoryName: "Quotes & Passages" },
        { id: 102, categoryNumber: "12", categoryName: "Observations" },
      ],
    },
    {
      id: 20,
      areaNumber: 20,
      areaName: "Clavis Aurea",
      categories: [{ id: 201, categoryNumber: "21", categoryName: "Terms" }],
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
    notebook: {
      list: {
        useQuery: () => ({
          data: mockState.notebookEntries,
          isLoading: false,
          refetch: mockState.notebookRefetchSpy,
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
  },
}));

describe("PKM inline editing UI", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
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

  it("saves notebook inline edits with the selected Johnny Decimal category", () => {
    const { container } = render(<Notebook />);

    const card = screen.getByText(/Original quote/).closest(".overflow-hidden") as HTMLElement;
    const editButton = within(card).getAllByRole("button")[0];
    fireEvent.click(editButton);

    fireEvent.change(screen.getByDisplayValue("Original quote"), {
      target: { value: "Revised quote" },
    });
    fireEvent.change(within(card).getByRole("combobox"), {
      target: { value: "102" },
    });
    fireEvent.click(screen.getByText("Save changes"));

    expect(mockState.notebookUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        text: "Revised quote",
        categoryId: 102,
      }),
    );
    expect(mockState.notebookRefetchSpy).toHaveBeenCalled();
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
