import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false }) }));
import DashboardLayout from "./DashboardLayout";

const title = "Devasophy PKM | Personal Knowledge & Research Workspace";
const description = "Organize notes, quotations, ideas, and research in Devasophy PKM. Connect knowledge with a personal lexicon, project tools, and AI-powered synthesis.";
const keywords = "personal knowledge management, research workspace, commonplace notebook, personal lexicon, AI synthesis";
const heading = "Your personal knowledge and research workspace";

beforeEach(() => {
  document.title = "Original page";
  document.head.querySelectorAll('meta[name="description"], meta[name="keywords"]').forEach((tag) => tag.remove());
  localStorage.clear();
});
afterEach(cleanup);

describe("signed-out homepage SEO", () => {
  it("sets the exact homepage title, metadata, and visible H2 within all strict limits", () => {
    render(<DashboardLayout currentModule="home"><p>Private content</p></DashboardLayout>);
    expect(document.title).toBe(title);
    expect(document.title.length).toBeGreaterThanOrEqual(30);
    expect(document.title.length).toBeLessThanOrEqual(60);
    const descriptionTag = document.head.querySelector('meta[name="description"]');
    expect(descriptionTag?.getAttribute("content")).toBe(description);
    expect(description.length).toBeGreaterThanOrEqual(50);
    expect(description.length).toBeLessThanOrEqual(160);
    const keywordTag = document.head.querySelector('meta[name="keywords"]');
    expect(keywordTag?.getAttribute("content")).toBe(keywords);
    const count = keywordTag!.getAttribute("content")!.split(",").filter((word) => word.trim()).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(8);
    expect(screen.getByRole("heading", { level: 2, name: heading })).toBeTruthy();
    expect(heading.length).toBeLessThanOrEqual(80);
    expect(screen.queryByText("Private content")).toBeNull();
  });

  it("updates existing meta tags without duplicating them and restores values on route exit", () => {
    for (const name of ["description", "keywords"]) {
      const tag = document.createElement("meta");
      tag.name = name;
      tag.content = `Original ${name}`;
      document.head.appendChild(tag);
    }
    const { rerender } = render(<DashboardLayout currentModule="home">Private</DashboardLayout>);
    rerender(<DashboardLayout currentModule="home">Private</DashboardLayout>);
    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('meta[name="keywords"]')).toHaveLength(1);
    rerender(<DashboardLayout currentModule="lexicon">Private</DashboardLayout>);
    expect(document.title).toBe("Original page");
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute("content")).toBe("Original description");
    expect(document.head.querySelector('meta[name="keywords"]')?.getAttribute("content")).toBe("Original keywords");
    expect(screen.queryByRole("heading", { level: 2, name: heading })).toBeNull();
  });

  it("does not apply home metadata on other routes and cleans up newly created tags", () => {
    const { rerender, unmount } = render(<DashboardLayout currentModule="lexicon">Private</DashboardLayout>);
    expect(document.title).toBe("Original page");
    expect(document.head.querySelector('meta[name="description"]')).toBeNull();
    rerender(<DashboardLayout currentModule="home">Private</DashboardLayout>);
    expect(document.title).toBe(title);
    unmount();
    expect(document.title).toBe("Original page");
    expect(document.head.querySelector('meta[name="description"]')).toBeNull();
    expect(document.head.querySelector('meta[name="keywords"]')).toBeNull();
  });
});
