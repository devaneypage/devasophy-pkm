import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it } from "vitest";
import TaxonomySidebar from "./TaxonomySidebar";

describe("TaxonomySidebar", () => {
  it("renders in a compact collapsed state by default", () => {
    render(<TaxonomySidebar />);

    expect(screen.getByText("Taxonomy outline")).toBeTruthy();
    expect(screen.getByText("Johnny Decimal")).toBeTruthy();
    expect(screen.queryByText("Knowledge Capture")).toBeNull();
    expect(screen.queryByText("Quotes & Passages")).toBeNull();
  });

  it("reveals taxonomy areas when the compact shell is expanded", () => {
    render(<TaxonomySidebar />);

    fireEvent.click(screen.getByRole("button", { name: /johnny decimal/i }));

    expect(screen.getByText("Knowledge Capture")).toBeTruthy();
    expect(screen.getByText("Vocabulary & Language")).toBeTruthy();
  });

  it("keeps individual categories collapsed until an area is opened", () => {
    render(<TaxonomySidebar />);

    fireEvent.click(screen.getByRole("button", { name: /johnny decimal/i }));
    expect(screen.queryByText("Quotes & Passages")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /knowledge capture/i }));
    expect(screen.getByText("Quotes & Passages")).toBeTruthy();
    expect(screen.getByText("Observations")).toBeTruthy();
  });
});
