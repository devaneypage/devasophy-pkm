import { describe, expect, it } from "vitest";
import { buildAutofillErrorMessage, buildAutofillLoadState } from "../shared/importAutofill";

describe("autofill helper state", () => {
  it("keeps uploaded Quotes content in quotes mode and preserves the loaded filename", () => {
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
    expect(state.jsonInput).toContain("future paragraph");
  });

  it("switches to lexicon mode when the uploaded Clavis Aurea payload is autofilled", () => {
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

  it("returns user-facing autofill error text for both uploaded sources", () => {
    expect(buildAutofillErrorMessage("quotes")).toContain("Quotes");
    expect(buildAutofillErrorMessage("lexicon")).toContain("Clavis Aurea");
  });
});
