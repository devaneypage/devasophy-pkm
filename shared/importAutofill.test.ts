import { describe, expect, it } from "vitest";
import { buildAutofillErrorMessage, buildAutofillLoadState } from "./importAutofill";

describe("import autofill helpers", () => {
  it("keeps quote imports in quotes mode when the uploaded Quotes file is loaded", () => {
    const state = buildAutofillLoadState({
      preferredSource: "quotes",
      fileName: "Quotes-All_with_notes_with_metadata.json",
      text: JSON.stringify([
        {
          quote: "A commonplace note becomes a future paragraph.",
          by: "Devaney",
        },
      ]),
    });

    expect(state.importType).toBe("quotes");
    expect(state.loadedFileName).toBe("Quotes-All_with_notes_with_metadata.json");
    expect(state.jsonInput).toContain("commonplace note");
  });

  it("switches into lexicon mode when the uploaded Clavis Aurea payload is loaded", () => {
    const state = buildAutofillLoadState({
      preferredSource: "quotes",
      fileName: "Clavis_Aurea_Complete.json",
      text: JSON.stringify({
        meta: { name: "Clavis Aurea", total_entries: 354 },
        entries: [
          {
            term: "Aletheia",
            pos: "noun",
            definition: "Disclosure or unconcealment.",
          },
        ],
      }),
    });

    expect(state.importType).toBe("lexicon");
    expect(state.loadedFileName).toBe("Clavis_Aurea_Complete.json");
  });

  it("returns the appropriate inline autofill error messages for both uploaded sources", () => {
    expect(buildAutofillErrorMessage("quotes")).toContain("Quotes");
    expect(buildAutofillErrorMessage("lexicon")).toContain("Clavis Aurea");
  });
});
