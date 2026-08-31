import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const setLocation = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/library", setLocation],
}));

vi.mock("lucide-react", () => {
  const Icon = ({ className }: { className?: string }) => <span className={className}>icon</span>;
  return {
    ArrowUpRight: Icon,
    BookOpenText: Icon,
    Bookmark: Icon,
    Brain: Icon,
    FileText: Icon,
    LibraryBig: Icon,
    ListChecks: Icon,
    Quote: Icon,
    Search: Icon,
    Sparkles: Icon,
    Star: Icon,
    X: Icon,
  };
});

const fixture = {
  board: { id: 1, title: "Reading Room" },
  columns: [
    { id: 10, title: "01 - Foundations" },
    { id: 11, title: "02 - Atelier" },
  ],
  entries: [
    {
      id: 101,
      boardId: 1,
      columnId: 10,
      entryType: "quote",
      title: "Attention is the beginning of devotion",
      summary: "A phrase to return to while designing a practice.",
      content: { text: "Attention is the beginning of devotion.", source: "Mary Oliver" },
      metadata: null,
      tags: "attention, practice",
      updatedAt: "2026-08-30T12:00:00.000Z",
    },
    {
      id: 102,
      boardId: 1,
      columnId: 11,
      entryType: "book",
      title: "How to Take Smart Notes",
      summary: "A bibliographic anchor for a durable note-making practice.",
      content: { notes: "Literature notes, permanent notes, and linking.", author: "Sönke Ahrens" },
      metadata: null,
      tags: "zettelkasten, reading",
      updatedAt: "2026-08-29T12:00:00.000Z",
    },
    {
      id: 103,
      boardId: 1,
      columnId: 10,
      entryType: "glossary_term",
      title: "Epistemics",
      summary: "The study of knowledge itself.",
      content: { definition: "The study of knowledge itself." },
      metadata: null,
      tags: "knowledge, ontology",
      updatedAt: "2026-08-28T12:00:00.000Z",
    },
  ],
};

vi.mock("@/lib/trpc", () => ({
  trpc: {
    commonplace: {
      bootstrap: {
        useQuery: () => ({ data: fixture, isLoading: false }),
      },
    },
  },
}));

import Library from "./Library";

describe("Library Reading Room", () => {
  beforeEach(() => {
    setLocation.mockClear();
  });

  it("renders a calm artifact index with counts and a reader margin", () => {
    render(<Library />);

    expect(screen.getByRole("heading", { name: /reading room for working knowledge/i })).toBeTruthy();
    expect(screen.getByText((_, node) => node?.tagName === "P" && node.textContent?.includes("3 of 3 artifacts"))).toBeTruthy();
    expect(screen.getByText("Master Classification Key")).toBeTruthy();
    expect(screen.getByText("Reader’s margin")).toBeTruthy();
    expect(screen.getAllByText("Attention is the beginning of devotion").length).toBeGreaterThan(0);
  });

  it("filters the index through a text query and taxonomy facet", () => {
    render(<Library />);

    fireEvent.change(screen.getByRole("textbox", { name: "Search the artifact index" }), {
      target: { value: "Sönke" },
    });
    expect(screen.getByText((_, node) => node?.tagName === "P" && node.textContent?.includes("1 of 3 artifacts"))).toBeTruthy();
    expect(screen.getAllByText("How to Take Smart Notes").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /quotes 1/i }));
    expect(screen.getByText("The shelf is clear from this angle.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /reset view/i }));
    expect(screen.getByText((_, node) => node?.tagName === "P" && node.textContent?.includes("3 of 3 artifacts"))).toBeTruthy();
  });

  it("supports starring, artifact selection, and the drafting escape route", () => {
    render(<Library />);

    fireEvent.click(screen.getAllByRole("button", { name: "Star How to Take Smart Notes" })[0]);
    fireEvent.click(screen.getByRole("button", { name: /starred 1/i }));
    expect(screen.getByText((_, node) => node?.tagName === "P" && node.textContent?.includes("1 of 3 artifacts"))).toBeTruthy();

    fireEvent.click(screen.getAllByText("How to Take Smart Notes")[0]);
    expect(screen.getAllByText("Sönke Ahrens").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /add to commonplace/i }));
    expect(setLocation).toHaveBeenCalledWith("/commonplace");
  });
});
