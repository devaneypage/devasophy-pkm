import {
  defaultSemanticLinkPresetByTarget,
  formatSemanticLinkDisplay,
  formatSemanticLinkLabel,
  getSemanticLinkPreset,
} from "./linkSemantics";

describe("linkSemantics", () => {
  it("returns the expected default preset for each target type", () => {
    expect(defaultSemanticLinkPresetByTarget.notebook).toBe("supports");
    expect(defaultSemanticLinkPresetByTarget.lexicon).toBe("defines");
    expect(defaultSemanticLinkPresetByTarget.document).toBe("develops");
  });

  it("formats forward relationships with a right arrow", () => {
    expect(formatSemanticLinkLabel("supports")).toBe("Supports →");
    expect(formatSemanticLinkDisplay("supports", "lexicon")).toBe("Supports → lexicon");
  });

  it("formats backward relationships with a left arrow", () => {
    expect(formatSemanticLinkLabel("defines")).toBe("Defines ←");
    expect(formatSemanticLinkDisplay("defines", "document")).toBe("document ← Defines");
  });

  it("formats bidirectional relationships with a two-way arrow", () => {
    expect(formatSemanticLinkLabel("related")).toBe("Related ↔");
    expect(formatSemanticLinkDisplay("contradicts", "notebook")).toBe("Contradicts ↔ notebook");
  });

  it("falls back to a titled custom relationship when a preset is unknown", () => {
    const preset = getSemanticLinkPreset("builds_on");
    expect(preset.label).toBe("Builds On");
    expect(preset.symbol).toBe("↔");
    expect(formatSemanticLinkDisplay("builds_on", "document")).toBe("Builds On ↔ document");
  });
});
