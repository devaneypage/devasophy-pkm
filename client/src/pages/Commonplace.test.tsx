import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const invalidate = vi.fn();
const createEntryMutate = vi.fn();
const updateEntryMutate = vi.fn();
const deleteEntryMutate = vi.fn();
const moveEntryMutate = vi.fn();
const createColumnMutate = vi.fn();
const saveBoardMutate = vi.fn();

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock("@/components/ui/textarea", () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("lucide-react", () => {
  const Icon = ({ className }: { className?: string }) => <span className={className}>icon</span>;
  return {
    BookOpenText: Icon,
    Bookmark: Icon,
    Brain: Icon,
    FileText: Icon,
    GripVertical: Icon,
    LibraryBig: Icon,
    Plus: Icon,
    Quote: Icon,
    Save: Icon,
    Search: Icon,
    Sparkles: Icon,
    Tags: Icon,
    Trash2: Icon,
  };
});

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      commonplace: {
        boards: { list: { invalidate } },
        bootstrap: { invalidate },
        entries: { list: { invalidate } },
      },
    }),
    commonplace: {
      boards: {
        list: {
          useQuery: () => ({
            data: [
              { id: 10, title: "Commonplace", description: "Working board", isDefault: true },
              { id: 11, title: "Saved Board", description: "Snapshot", isDefault: false },
            ],
          }),
        },
        saveSnapshot: {
          useMutation: () => ({ isPending: false, mutate: saveBoardMutate }),
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
            entries: [
              {
                id: 101,
                boardId: 10,
                columnId: 1,
                entryType: "research_note",
                title: "Archive architecture notes",
                summary: "Rethink structure for commonplace capture.",
                content: { markdown: "## Notes" },
                metadata: null,
                tags: "architecture,notes",
                position: 0,
                isArchived: false,
              },
            ],
          },
        }),
      },
      columns: {
        create: {
          useMutation: () => ({ isPending: false, mutate: createColumnMutate }),
        },
      },
      entries: {
        create: {
          useMutation: () => ({ isPending: false, mutate: createEntryMutate }),
        },
        update: {
          useMutation: () => ({ isPending: false, mutate: updateEntryMutate }),
        },
        delete: {
          useMutation: () => ({ isPending: false, mutate: deleteEntryMutate }),
        },
        move: {
          useMutation: () => ({ isPending: false, mutate: moveEntryMutate }),
        },
      },
    },
  },
}));

import Commonplace from "./Commonplace";

describe("Commonplace workspace", () => {
  beforeEach(() => {
    invalidate.mockClear();
    createEntryMutate.mockClear();
    updateEntryMutate.mockClear();
    deleteEntryMutate.mockClear();
    moveEntryMutate.mockClear();
    createColumnMutate.mockClear();
    saveBoardMutate.mockClear();
    vi.stubGlobal("prompt", vi.fn(() => "Saved Research Board"));
  });

  it("renders the new card-based commonplace workspace and taxonomy pills", () => {
    render(<Commonplace />);

    expect(screen.getByText("Remember everything. Shape it on cards.")).toBeTruthy();
    expect(screen.getByText("notes")).toBeTruthy();
    expect(screen.getByText("bookmarks")).toBeTruthy();
    expect(screen.getByText("ideas")).toBeTruthy();
    expect(screen.getByText("Archive architecture notes")).toBeTruthy();
    expect(screen.getByText("Inbox")).toBeTruthy();
  });

  it("opens the card editor and submits a new research note", () => {
    render(<Commonplace />);

    fireEvent.click(screen.getByRole("button", { name: /add a card to inbox/i }));
    fireEvent.change(screen.getByPlaceholderText("Name the card with a phrase you will recognize later"), {
      target: { value: "New commonplace card" },
    });
    fireEvent.change(screen.getByPlaceholderText("What makes this fragment worth preserving?"), {
      target: { value: "A fresh fragment" },
    });
    fireEvent.change(screen.getByPlaceholderText("Draft in markdown, capture fragments, or shape the card into a polished record."), {
      target: { value: "## Working note" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create card/i }));

    expect(createEntryMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        boardId: 10,
        columnId: 1,
        entryType: "research_note",
        title: "New commonplace card",
      })
    );
  });

  it("triggers save board snapshot from the drafting workspace", () => {
    render(<Commonplace />);

    fireEvent.click(screen.getByRole("button", { name: /save board/i }));

    expect(saveBoardMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceBoardId: 10,
        title: "Saved Research Board",
      })
    );
  });
});
