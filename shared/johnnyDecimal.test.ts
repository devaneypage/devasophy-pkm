import {
  getJohnnyDecimalAreas,
  getJohnnyDecimalSeedByCategoryNumber,
  johnnyDecimalModuleDefaults,
  johnnyDecimalSeeds,
} from "./johnnyDecimal";

describe("johnnyDecimalSeeds", () => {
  it("covers the ten master areas from the uploaded classification key", () => {
    const areas = getJohnnyDecimalAreas();

    expect(areas.map((area) => area.areaNumber)).toEqual([0, 1, 2, 3, 10, 11, 12, 13, 14, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 40, 41, 42, 43, 44, 45, 50, 51, 52, 53, 54, 55, 60, 61, 62, 63, 64, 70, 71, 72, 73, 74, 75, 76, 77, 78, 80, 81, 82, 83, 90, 91, 92]);
    expect(areas[0]?.areaName).toBe("SYSTEM & META");
    expect(areas.find((area) => area.areaNumber === 10)?.areaName).toBe("LANGUAGE & VOCABULARY");
    expect(areas.find((area) => area.areaNumber === 30)?.areaName).toBe("QUOTATIONS & EXCERPTS");
    expect(areas.find((area) => area.areaNumber === 90)?.areaName).toBe("ARCHIVE & COMPLETED");
  });

  it("contains unique category numbers for each seeded taxonomy leaf", () => {
    const categoryNumbers = johnnyDecimalSeeds.map((seed) => seed.categoryNumber);
    expect(new Set(categoryNumbers).size).toBe(categoryNumbers.length);
  });

  it("includes the key master-classification leaves used by the current workspace", () => {
    const categoryNames = johnnyDecimalSeeds.map((seed) => seed.categoryName);

    expect(categoryNames).toContain("General Vocabulary Lists (A–M)");
    expect(categoryNames).toContain("Word Origins & Histories");
    expect(categoryNames).toContain("Creativity & Art Quotations");
    expect(categoryNames).toContain("Observations & Insights");
    expect(categoryNames).toContain("Essay Drafts");
    expect(categoryNames).toContain("Recurring Patterns Across Sources");
  });

  it("exposes module defaults that resolve to valid master-key categories", () => {
    expect(getJohnnyDecimalSeedByCategoryNumber(johnnyDecimalModuleDefaults.notebookQuote)?.categoryName).toBe("Miscellaneous Quotations");
    expect(getJohnnyDecimalSeedByCategoryNumber(johnnyDecimalModuleDefaults.notebookNote)?.categoryName).toBe("Observations & Insights");
    expect(getJohnnyDecimalSeedByCategoryNumber(johnnyDecimalModuleDefaults.lexiconGeneral)?.categoryName).toBe("General Vocabulary Lists (A–M)");
    expect(getJohnnyDecimalSeedByCategoryNumber(johnnyDecimalModuleDefaults.documentDraft)?.categoryName).toBe("Essay Drafts");
  });
});
