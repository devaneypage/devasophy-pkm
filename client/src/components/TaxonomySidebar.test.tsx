import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockTree = [
  {
    id: 1,
    userId: 1,
    areaNumber: "10",
    areaName: "Knowledge Capture",
    description: null,
    count: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
    categories: [
      {
        id: 11,
        userId: 1,
        areaId: 1,
        categoryNumber: "11",
        categoryName: "Quotes & Passages",
        description: null,
        count: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 12,
        userId: 1,
        areaId: 1,
        categoryNumber: "12",
        categoryName: "Observations",
        description: null,
        count: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },
  {
    id: 2,
    userId: 1,
    areaNumber: "20",
    areaName: "Vocabulary & Language",
    description: null,
    count: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    categories: [
      {
        id: 21,
        userId: 1,
        areaId: 2,
        categoryNumber: "21",
        categoryName: "Lexicon Terms",
        description: null,
        count: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 22,
        userId: 1,
        areaId: 2,
        categoryNumber: "22",
        categoryName: "Etymology Notes",
        description: null,
        count: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },
];

vi.mock("@/lib/trpc", () => ({
  trpc: {
    taxonomy: {
      getTree: {
        useQuery: () => ({
          data: mockTree,
          isLoading: false,
          isError: false,
        }),
      },
    },
  },
}));

import TaxonomySidebar from "./TaxonomySidebar";

describe("TaxonomySidebar", () => {
  it("renders in a compact collapsed state by default with live summary counts", () => {
    render(<TaxonomySidebar />);

    expect(screen.getByText("Taxonomy outline")).toBeTruthy();
    expect(screen.getByText("Johnny Decimal")).toBeTruthy();
    expect(screen.getByText("2 areas · 4 categories · 8 live entries")).toBeTruthy();
    expect(screen.queryByText("Knowledge Capture")).toBeNull();
    expect(screen.queryByText("Quotes & Passages")).toBeNull();
  });

  it("reveals taxonomy areas when the compact shell is expanded", () => {
    render(<TaxonomySidebar />);

    fireEvent.click(screen.getByRole("button", { name: /johnny decimal/i }));

    expect(screen.getByText("Knowledge Capture")).toBeTruthy();
    expect(screen.getByText("Vocabulary & Language")).toBeTruthy();
    expect(screen.getByText("Active categories")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("keeps individual categories collapsed until an area is opened and then shows live category names and counts", () => {
    render(<TaxonomySidebar />);

    fireEvent.click(screen.getByRole("button", { name: /johnny decimal/i }));
    expect(screen.queryByText("Quotes & Passages")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /knowledge capture/i }));
    expect(screen.getByText("Quotes & Passages")).toBeTruthy();
    expect(screen.getByText("Observations")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
  });
});
