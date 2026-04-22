import { detectImportPayloadType } from "./pkmFormatting";

export type ImportMode = "quotes" | "lexicon";

export type AutofillLoadState = {
  importType: ImportMode;
  jsonInput: string;
  loadedFileName: string;
};

export function buildAutofillLoadState(params: {
  preferredSource: ImportMode;
  text: string;
  fileName: string;
}): AutofillLoadState {
  const { preferredSource, text, fileName } = params;

  try {
    const parsed = JSON.parse(text);
    const detected = detectImportPayloadType(parsed);

    return {
      importType: detected ?? preferredSource,
      jsonInput: text,
      loadedFileName: fileName,
    };
  } catch {
    return {
      importType: preferredSource,
      jsonInput: text,
      loadedFileName: fileName,
    };
  }
}

export function buildAutofillErrorMessage(source: ImportMode): string {
  return source === "lexicon"
    ? "Unable to load the uploaded Clavis Aurea file right now. Please try again or use drag-and-drop."
    : "Unable to load the uploaded Quotes file right now. Please try again or use drag-and-drop.";
}
