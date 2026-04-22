import { describe, expect, it } from "vitest";
import { getJohnnyDecimalAreas, johnnyDecimalSeeds } from "./johnnyDecimal";

describe("johnnyDecimalSeeds", () => {
  it("covers the seeded PKM areas needed by the current workspace", () => {
    const areas = getJohnnyDecimalAreas();

    expect(areas.map((area) => area.areaNumber)).toEqual([10, 20, 30, 40]);
    expect(areas.map((area) => area.areaName)).toEqual([
      "Commonplace Notebook",
      "Clavis Aurea",
      "Research & Writing Studio",
      "Semantic Links",
    ]);
  });

  it("contains unique category numbers for each seeded taxonomy category", () => {
    const categoryNumbers = johnnyDecimalSeeds.map((seed) => seed.categoryNumber);
    expect(new Set(categoryNumbers).size).toBe(categoryNumbers.length);
  });

  it("includes notebook, lexicon, and writing categories for selector support", () => {
    const categoryNames = johnnyDecimalSeeds.map((seed) => seed.categoryName);

    expect(categoryNames).toContain("Quotes & Passages");
    expect(categoryNames).toContain("Observations");
    expect(categoryNames).toContain("Terms");
    expect(categoryNames).toContain("Concordance");
    expect(categoryNames).toContain("Projects");
    expect(categoryNames).toContain("Drafts");
  });
});
