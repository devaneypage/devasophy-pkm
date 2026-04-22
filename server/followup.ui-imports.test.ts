import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CategoriesIcon,
  EssaysIcon,
  QuotationsIcon,
  VocabularyIcon,
} from "../client/src/components/DevanomyIcons";
import {
  buildLexiconReferenceInsert,
  buildNotebookReferenceInsert,
  detectImportPayloadType,
  normalizeLexiconImportItem,
} from "../shared/pkmFormatting";

describe("follow-up UI helpers", () => {
  it("detects the provided Clavis Aurea payload structure for drag-and-drop imports", () => {
    const payload = {
      meta: { name: "Clavis Aurea", total_entries: 354 },
      entries: [
        {
          term: "Aporia",
          pos: "noun",
          definition: "A state of puzzlement.",
          source_type: "Dictionary app",
          image_num: "221",
        },
      ],
    };

    expect(detectImportPayloadType(payload)).toBe("lexicon");
    expect(normalizeLexiconImportItem(payload.entries[0])).toMatchObject({
      term: "Aporia",
      partOfSpeech: "noun",
      imageNum: "221",
    });
  });

  it("renders the custom Devanomy SVG icons used on module tiles and navigation surfaces", () => {
    const markup = renderToStaticMarkup(
      createElement("div", null,
        createElement(QuotationsIcon),
        createElement(VocabularyIcon),
        createElement(EssaysIcon),
        createElement(CategoriesIcon)
      )
    );

    expect(markup).toContain("<svg");
    expect(markup).toContain("#d4af37");
    expect(markup).toContain("stroke-black");
  });

  it("detects quote payloads and formats inline reference blocks", () => {
    expect(
      detectImportPayloadType([
        { quote: "Quotation is the seed of composition.", by: "Devaney" },
      ])
    ).toBe("quotes");

    expect(
      buildNotebookReferenceInsert({
        text: "Quotation is the seed of composition.",
        author: "Devaney",
        work: "Notebook",
      })
    ).toContain("— Devaney, Notebook");

    expect(
      buildLexiconReferenceInsert({
        term: "Concordance",
        partOfSpeech: "noun",
        definition: "An index of thematic relations.",
      })
    ).toContain("**Concordance** (noun): An index of thematic relations.");
  });
});
