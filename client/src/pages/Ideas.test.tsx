import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRefetch = vi.fn(async () => undefined);
const mockCreateIdea = vi.fn();
const mockUpdateIdea = vi.fn();
const mockDeleteIdea = vi.fn();
let createShouldFail = false;
let updateShouldFail = false;

const mockIdeas = [
  {
    id: 1,
    title: "Map the hidden curriculum of LSAT tutoring",
    summary: "A synthesis thread about how tutoring often confuses performance rituals with genuine reasoning growth.",
    status: "germinating",
    dikwTier: "knowledge",
    sparkType: "argument",
    sourceModule: "documents",
    insightStage: "synthesis",
    tags: "teaching,lsat",
    linkedGoalId: 3,
    categoryId: undefined,
    linkedEntries: '[{"type":"document","id":1}]',
  },
  {
    id: 2,
    title: "Question whether speed is a proxy for understanding",
    summary: "An inquiry thread to pressure the assumptions beneath timed drilling.",
    status: "seed",
    dikwTier: "information",
    sparkType: "question",
    sourceModule: "manual",
    insightStage: "capture",
    tags: "questions",
    linkedGoalId: null,
    categoryId: undefined,
    linkedEntries: "",
  },
];

const mockNotebookEntries = [
  {
    id: 11,
    author: "Devaney Page",
    work: "Tutoring Notes",
    text: "Students often confuse speed rituals with actual comprehension.",
    note: "Notebook seed",
  },
];

const mockLexiconEntries = [
  {
    id: 21,
    term: "Hidden curriculum",
    definition: "The implicit lessons embedded in instructional systems.",
    notes: "Lexicon thread",
  },
];

const mockDocuments = [
  {
    id: 1,
    title: "LSAT Performance Draft",
    project: "Teaching Framework",
    folder: "Research",
    content: "Draft arguing that performance rituals distort reasoning growth.",
  },
  {
    id: 7,
    title: "Jurisprudence Teaching Atlas",
    project: "Atlas",
    folder: "Drafts",
    content: "A document for mapping doctrine, rhetoric, and reasoning tensions.",
  },
];

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/CategorySelect", () => ({
  default: () => <div data-testid="category-select" />,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
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
    documents: {
      list: {
        useQuery: () => ({ data: mockDocuments, isLoading: false }),
      },
    },
    goals: {
      list: {
        useQuery: () => ({
          data: [
            { id: 3, title: "Publish a Devanomy teaching framework" },
            { id: 4, title: "Refine the writing studio workflow" },
          ],
          isLoading: false,
        }),
      },
    },
    ideas: {
      list: {
        useQuery: () => ({
          data: mockIdeas,
          isLoading: false,
          refetch: mockRefetch,
        }),
      },
      create: {
        useMutation: (options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => ({
          mutate: (payload: unknown) => {
            mockCreateIdea(payload);
            if (createShouldFail) {
              options?.onError?.(new Error("Create failed for idea test"));
              return;
            }
            options?.onSuccess?.();
          },
          isPending: false,
        }),
      },
      update: {
        useMutation: (options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => ({
          mutate: (payload: unknown) => {
            mockUpdateIdea(payload);
            if (updateShouldFail) {
              options?.onError?.(new Error("Update failed for idea test"));
              return;
            }
            options?.onSuccess?.();
          },
          isPending: false,
        }),
      },
      delete: {
        useMutation: (options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => ({
          mutate: (payload: unknown) => {
            mockDeleteIdea(payload);
            options?.onSuccess?.();
          },
          isPending: false,
        }),
      },
    },
  },
}));

import Ideas from "./Ideas";

describe("Ideas page", () => {
  beforeEach(() => {
    createShouldFail = false;
    updateShouldFail = false;
    mockRefetch.mockClear();
    mockCreateIdea.mockClear();
    mockUpdateIdea.mockClear();
    mockDeleteIdea.mockClear();
  });

  it("renders the idea list and applies spark filters", async () => {
    render(<Ideas />);

    expect(screen.getByText("Map the hidden curriculum of LSAT tutoring")).toBeTruthy();
    expect(screen.getByText("Question whether speed is a proxy for understanding")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Argument" })[0]);

    await waitFor(() => {
      expect(screen.getByText("Map the hidden curriculum of LSAT tutoring")).toBeTruthy();
      expect(screen.queryByText("Question whether speed is a proxy for understanding")).toBeNull();
    });
  });

  it("submits a new idea with guided linked-record selection", async () => {
    render(<Ideas />);

    fireEvent.click(screen.getByRole("button", { name: "Capture idea" }));
    fireEvent.change(screen.getByLabelText("Create idea title"), {
      target: { value: "Design a jurisprudence teaching atlas" },
    });
    fireEvent.change(screen.getByLabelText("Create idea summary"), {
      target: { value: "A framework for mapping doctrine, rhetoric, and reasoning tensions." },
    });
    fireEvent.click(
      screen.getByText("A conceptual scaffold that organizes multiple notes or sources.").closest("button") as HTMLButtonElement
    );
    fireEvent.click(screen.getByRole("button", { name: /wisdom/i }));
    fireEvent.change(screen.getByLabelText("Create insight stage"), {
      target: { value: "expression" },
    });
    fireEvent.change(screen.getByLabelText("Create source module"), {
      target: { value: "documents" },
    });
    fireEvent.change(screen.getByLabelText("Create anchor goal"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Documents" }));
    fireEvent.click(screen.getByLabelText("Add document record 7"));
    fireEvent.change(screen.getByLabelText("Create tags"), {
      target: { value: "framework,teaching" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save idea" }));

    await waitFor(() => {
      expect(mockCreateIdea).toHaveBeenCalledWith({
        title: "Design a jurisprudence teaching atlas",
        summary: "A framework for mapping doctrine, rhetoric, and reasoning tensions.",
        categoryId: undefined,
        linkedGoalId: 3,
        status: "seed",
        dikwTier: "wisdom",
        sparkType: "framework",
        sourceModule: "documents",
        insightStage: "expression",
        tags: "framework,teaching",
        linkedEntries: '[{"type":"document","id":7}]',
      });
    });
  });

  it("supports inline editing with guided linked-record changes", async () => {
    render(<Ideas />);

    const firstIdeaCard = screen
      .getByText("Map the hidden curriculum of LSAT tutoring")
      .closest(".dev-card") as HTMLElement;

    fireEvent.click(within(firstIdeaCard).getByRole("button", { name: "Edit idea" }));
    expect(screen.getByText("LSAT Performance Draft")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Remove document record 1"));
    fireEvent.click(screen.getByRole("button", { name: "Notebook" }));
    fireEvent.click(screen.getByLabelText("Add notebook record 11"));
    fireEvent.change(screen.getByLabelText("Edit idea title"), {
      target: { value: "Map the hidden curriculum of LSAT tutoring v2" },
    });
    fireEvent.change(screen.getByLabelText("Edit idea summary"), {
      target: { value: "A sharper synthesis note about hidden performance rituals." },
    });
    fireEvent.change(screen.getByLabelText("Edit tags"), {
      target: { value: "teaching,lsat,hidden-curriculum" },
    });
    fireEvent.change(screen.getByLabelText("Edit anchor goal"), {
      target: { value: "4" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockUpdateIdea).toHaveBeenCalledWith({
        id: 1,
        title: "Map the hidden curriculum of LSAT tutoring v2",
        summary: "A sharper synthesis note about hidden performance rituals.",
        linkedGoalId: 4,
        status: "germinating",
        dikwTier: "knowledge",
        sparkType: "argument",
        sourceModule: "documents",
        insightStage: "synthesis",
        tags: "teaching,lsat,hidden-curriculum",
        linkedEntries: '[{"type":"notebook","id":11}]',
      });
    });
  });

  it("shows visible failure feedback when an idea update fails", async () => {
    updateShouldFail = true;
    render(<Ideas />);

    const firstIdeaCard = screen
      .getByText("Map the hidden curriculum of LSAT tutoring")
      .closest(".dev-card") as HTMLElement;

    fireEvent.click(within(firstIdeaCard).getByRole("button", { name: "Edit idea" }));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(screen.getByText("Update failed for idea test")).toBeTruthy();
    });
  });
});
