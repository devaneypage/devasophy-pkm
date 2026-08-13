import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSetLocation = vi.fn();
const mockInvalidate = vi.fn(async () => undefined);
const mockRefetch = vi.fn();
const mockCreateDocument = vi.fn();
const mockUpdateDocument = vi.fn();
const mockDeleteDocument = vi.fn();
const mockCreateLink = vi.fn(async () => undefined);
const mockResearchAssist = vi.fn();

const mockDocuments = [
  {
    id: 1,
    userId: 1,
    categoryId: 101,
    uuid: "doc-1",
    title: "Essay Draft",
    content: "Draft paragraph about education.",
    project: "Contrarian Pedagogy",
    folder: "Working drafts",
    status: "draft",
    dikwTier: "knowledge",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockSelectedDocument = mockDocuments[0];

const mockLinkedReferences = [
  {
    id: 77,
    userId: 1,
    sourceType: "document",
    sourceId: 1,
    targetType: "notebook",
    targetId: 14,
    linkType: "supports",
    targetTitle: "Hannah Arendt — The Human Condition",
    targetPreview: "Power emerges where people act together in public.",
    targetExcerpt: "Power emerges where people act together in public.",
    targetHref: "/notebook/14",
    targetMetadata: "Book • p. 44",
  },
];

const mockNotebookEntries = [
  {
    id: 14,
    text: "Power emerges where people act together in public.",
    author: "Hannah Arendt",
    work: "The Human Condition",
    note: "Useful for civic agency framing.",
  },
];

const mockLexiconEntries = [
  {
    id: 29,
    term: "paideia",
    partOfSpeech: "noun",
    definition: "A model of holistic education and formation.",
    notes: "Good for classical framing.",
  },
];

vi.mock("uuid", () => ({
  v4: () => "generated-uuid",
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/documents", mockSetLocation],
}));

vi.mock("@/components/CategorySelect", () => ({
  default: () => <div data-testid="category-select" />,
}));

vi.mock("@/components/AIChatBox", () => ({
  AIChatBox: ({ messages, onSendMessage, suggestedPrompts }: { messages: Array<{ role: string; content: string }>; onSendMessage: (content: string) => void; suggestedPrompts?: string[] }) => (
    <div>
      <div data-testid="assistant-message-count">{messages.length}</div>
      <button onClick={() => onSendMessage(suggestedPrompts?.[0] || "Explain this draft")}>Send prompt</button>
      {messages.map((message, index) => (
        <div key={index}>{message.content}</div>
      ))}
    </div>
  ),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      links: {
        list: {
          invalidate: mockInvalidate,
        },
      },
      documents: {
        get: {
          invalidate: mockInvalidate,
        },
        linkedReferences: {
          invalidate: mockInvalidate,
        },
      },
    }),
    documents: {
      list: {
        useQuery: () => ({
          data: mockDocuments,
          isLoading: false,
          refetch: mockRefetch,
        }),
      },
      get: {
        useQuery: (_input: { id: number }, options?: { enabled?: boolean }) => ({
          data: options?.enabled ? mockSelectedDocument : undefined,
        }),
      },
      linkedReferences: {
        useQuery: (_input: { id: number }, options?: { enabled?: boolean }) => ({
          data: options?.enabled ? mockLinkedReferences : undefined,
        }),
      },
      create: {
        useMutation: () => ({
          mutate: mockCreateDocument,
          isPending: false,
        }),
      },
      update: {
        useMutation: () => ({
          mutate: mockUpdateDocument,
          isPending: false,
        }),
      },
      delete: {
        useMutation: () => ({
          mutate: mockDeleteDocument,
          isPending: false,
        }),
      },
      researchAssist: {
        useMutation: (options?: { onSuccess?: (result: { response: string; contextCount: number }) => void }) => ({
          mutate: (input: { documentId: number; messages: Array<{ role: "user" | "assistant"; content: string }> }) => {
            mockResearchAssist(input);
            options?.onSuccess?.({
              response: "Assistant synthesis returned.",
              contextCount: mockLinkedReferences.length,
            });
          },
          isPending: false,
        }),
      },
    },
    taxonomy: {
      getTree: {
        useQuery: () => ({ data: [], isLoading: false }),
      },
    },
    notebook: {
      list: {
        useQuery: () => ({ data: { items: mockNotebookEntries, pageInfo: { total: mockNotebookEntries.length } }, isLoading: false }),
      },
    },
    lexicon: {
      list: {
        useQuery: () => ({ data: mockLexiconEntries, isLoading: false }),
      },
    },
    links: {
      create: {
        useMutation: () => ({
          mutateAsync: mockCreateLink,
          isPending: false,
        }),
      },
    },
  },
}));

import Documents from "./Documents";

describe("Documents Writing Studio", () => {
  beforeEach(() => {
    mockSetLocation.mockReset();
    mockInvalidate.mockClear();
    mockRefetch.mockClear();
    mockCreateDocument.mockClear();
    mockUpdateDocument.mockClear();
    mockDeleteDocument.mockClear();
    mockCreateLink.mockClear();
    mockResearchAssist.mockClear();
  });

  it("renders enriched linked references for the selected document", async () => {
    render(<Documents />);

    fireEvent.click(screen.getByText("Essay Draft"));

    await waitFor(() => {
      expect(document.body.textContent).toContain("Hannah Arendt");
      expect(document.body.textContent).toContain("The Human Condition");
      expect(document.body.textContent).toContain("Power emerges where people act together in public.");
      expect(document.body.textContent).toContain("Book • p. 44");
    });
  });

  it("sends the selected document context through the research assistant mutation", async () => {
    render(<Documents />);

    fireEvent.click(screen.getByText("Essay Draft"));
    fireEvent.click(await screen.findByRole("button", { name: "Send prompt" }));

    await waitFor(() => {
      expect(mockResearchAssist).toHaveBeenCalledWith({
        documentId: 1,
        messages: [
          {
            role: "user",
            content: "Summarize the argument emerging from this draft and the linked sources.",
          },
        ],
      });
    });

    expect(screen.getByText("Assistant synthesis returned.")).toBeTruthy();
  });

  it("saves the selected document with the updated DIKW tier", async () => {
    render(<Documents />);

    fireEvent.click(screen.getByText("Essay Draft"));
    fireEvent.click(await screen.findByRole("button", { name: "Wisdom" }));
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      expect(mockUpdateDocument).toHaveBeenCalledWith({
        id: 1,
        content: "Draft paragraph about education.",
        dikwTier: "wisdom",
      });
    });

    expect(document.body.textContent).toContain("wisdom");
  });
});
