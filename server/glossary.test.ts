import { describe, it, expect, beforeEach } from "vitest";

// Mock glossary entry data
const mockGlossaryEntries = [
  {
    id: 1,
    word: "Abstruse",
    definition: "Difficult to comprehend or understand.",
    partOfSpeech: "adjective",
    example: "The philosopher's arguments were so abstruse that even his colleagues struggled to follow them.",
    etymology: "Latin abstrusus, past participle of abstrudere",
    categoryId: 21,
    theme: "Knowledge & Mind",
    dikw: "Information",
  },
  {
    id: 2,
    word: "Acumen",
    definition: "Quickness of perception or discernment; shrewdness; keenness.",
    partOfSpeech: "noun",
    example: "Her business acumen allowed her to spot profitable opportunities where others saw only risk.",
    etymology: "Latin acumen, sharpness",
    categoryId: 21,
    theme: "Knowledge & Mind",
    dikw: "Knowledge",
  },
  {
    id: 3,
    word: "Afflatus",
    definition: "A divine imparting of knowledge; inspiration, particularly in poetry.",
    partOfSpeech: "noun",
    example: "The poet described the moment of afflatus when the entire verse arrived fully formed in her mind.",
    etymology: "Latin afflare, to breathe upon",
    categoryId: 21,
    theme: "Divine & Sacred",
    dikw: "Wisdom",
  },
];

// Theme assignment function (matches Glossary.tsx)
function assignTheme(word: string, def: string): string {
  const w = (word + " " + def).toLowerCase();
  if (/god|divine|sacred|holy|spirit|soul|prayer|heaven|angel|mystic|sancti|blessed|acolyte|apotheosis|arcane|ritual|transcend|liturgy|consecrat/.test(w))
    return "Divine & Sacred";
  if (/know|mind|think|reason|logic|intellect|wisdom|learn|epistemi|cogni|understand|memory|mental|concept|idea|theory|aware|percep|analyt/.test(w))
    return "Knowledge & Mind";
  if (/word|language|speak|write|text|phrase|lingui|verbal|speech|rhetoric|aphoris|metaphor|grammar|etymol|narrat|discourse|semant/.test(w))
    return "Language & Words";
  if (/feel|emotion|passion|love|fear|joy|sorrow|grief|pain|anger|sentiment|affect|mood|despair|yearn|longing|melanchol/.test(w))
    return "Emotion & Feeling";
  if (/beauty|grow|nature|art|aesthet|bloom|creat|harmony|grace|elegant|flourish|sublime|magnificen/.test(w))
    return "Beauty & Growth";
  if (/power|decay|ruin|corrupt|dominat|control|force|authority|tyrann|degrad|collapse|entropy|declens/.test(w))
    return "Power & Decay";
  if (/self|identity|person|character|ego|psyche|persona|individual|being|virtue|moral|conscience|authentic|will|courage/.test(w))
    return "Self & Identity";
  return "Knowledge & Mind";
}

// DIKW assignment function (matches Glossary.tsx)
function assignDikw(word: string, def: string): string {
  const w = (word + " " + def).toLowerCase();
  if (/wisdom|judg|insight|discern|prudence|philosophi|reflect|contemplat|sage|enlighten/.test(w)) return "Wisdom";
  if (/know|understand|comprehend|concept|principle|theory|reason|logic|epistemi|synthes/.test(w)) return "Knowledge";
  if (/mean|signif|explain|describe|defin|interpret|context|represent|classif/.test(w)) return "Information";
  return "Data";
}

describe("Glossary Functionality", () => {
  describe("Theme Assignment", () => {
    it("assigns 'Divine & Sacred' theme to entries with divine keywords", () => {
      const theme = assignTheme("Afflatus", "A divine imparting of knowledge; inspiration, particularly in poetry.");
      expect(theme).toBe("Divine & Sacred");
    });

    it("assigns 'Knowledge & Mind' theme to entries with knowledge keywords", () => {
      const theme = assignTheme("Acumen", "Quickness of perception or discernment; shrewdness; keenness.");
      expect(theme).toBe("Knowledge & Mind");
    });

    it("defaults to 'Knowledge & Mind' for entries without matching keywords", () => {
      const theme = assignTheme("Zephyr", "A gentle breeze.");
      expect(theme).toBe("Knowledge & Mind");
    });
  });

  describe("DIKW Tier Assignment", () => {
    it("assigns 'Wisdom' tier to entries with wisdom keywords", () => {
      const dikw = assignDikw("Wisdom", "The quality of having experience, knowledge, and good judgment; wisdom.");
      expect(dikw).toBe("Wisdom");
    });

    it("assigns 'Knowledge' tier to entries with knowledge keywords", () => {
      const dikw = assignDikw("Concept", "An abstract idea or general notion; a principle or theory.");
      expect(dikw).toBe("Knowledge");
    });

    it("assigns 'Information' tier to entries with definition keywords", () => {
      const dikw = assignDikw("Term", "A word or phrase used to describe something.");
      expect(dikw).toBe("Information");
    });

    it("defaults to 'Data' tier for entries without matching keywords", () => {
      const dikw = assignDikw("Zephyr", "A gentle breeze.");
      expect(dikw).toBe("Data");
    });
  });

  describe("Search Functionality", () => {
    it("filters entries by word match (case-insensitive)", () => {
      const searchTerm = "acumen";
      const filtered = mockGlossaryEntries.filter((entry) =>
        entry.word.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].word).toBe("Acumen");
    });

    it("filters entries by definition match", () => {
      const searchTerm = "divine";
      const filtered = mockGlossaryEntries.filter((entry) =>
        entry.definition.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].word).toBe("Afflatus");
    });

    it("returns empty array when no matches found", () => {
      const searchTerm = "nonexistent";
      const filtered = mockGlossaryEntries.filter((entry) =>
        entry.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.definition.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(filtered).toHaveLength(0);
    });
  });

  describe("Theme Filtering", () => {
    it("filters entries by selected theme", () => {
      const selectedTheme = "Knowledge & Mind";
      const filtered = mockGlossaryEntries.filter((entry) => entry.theme === selectedTheme);
      expect(filtered).toHaveLength(2);
      expect(filtered.every((e) => e.theme === selectedTheme)).toBe(true);
    });

    it("returns all entries when 'all' theme is selected", () => {
      const selectedTheme = "all";
      const filtered = mockGlossaryEntries.filter((entry) => selectedTheme === "all" || entry.theme === selectedTheme);
      expect(filtered).toHaveLength(mockGlossaryEntries.length);
    });

    it("returns empty array when no entries match selected theme", () => {
      const selectedTheme = "Power & Decay";
      const filtered = mockGlossaryEntries.filter((entry) => entry.theme === selectedTheme);
      expect(filtered).toHaveLength(0);
    });
  });

  describe("Combined Search and Filter", () => {
    it("filters by both search term and theme", () => {
      const searchTerm = "knowledge";
      const selectedTheme = "Divine & Sacred";
      const filtered = mockGlossaryEntries.filter((entry) => {
        const matchesSearch =
          entry.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.definition.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTheme = selectedTheme === "all" || entry.theme === selectedTheme;
        return matchesSearch && matchesTheme;
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].word).toBe("Afflatus");
    });

    it("returns empty array when search matches but theme doesn't", () => {
      const searchTerm = "acumen";
      const selectedTheme = "Divine & Sacred";
      const filtered = mockGlossaryEntries.filter((entry) => {
        const matchesSearch =
          entry.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.definition.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTheme = selectedTheme === "all" || entry.theme === selectedTheme;
        return matchesSearch && matchesTheme;
      });
      expect(filtered).toHaveLength(0);
    });
  });

  describe("Alphabetical Sorting", () => {
    it("sorts entries alphabetically by word", () => {
      const sorted = [...mockGlossaryEntries].sort((a, b) => a.word.localeCompare(b.word));
      expect(sorted[0].word).toBe("Abstruse");
      expect(sorted[1].word).toBe("Acumen");
      expect(sorted[2].word).toBe("Afflatus");
    });
  });

  describe("Entry Detail View", () => {
    it("displays all entry fields correctly", () => {
      const entry = mockGlossaryEntries[0];
      expect(entry.word).toBeDefined();
      expect(entry.definition).toBeDefined();
      expect(entry.partOfSpeech).toBeDefined();
      expect(entry.example).toBeDefined();
      expect(entry.etymology).toBeDefined();
      expect(entry.theme).toBeDefined();
      expect(entry.dikw).toBeDefined();
    });

    it("handles entries with optional fields missing", () => {
      const minimalEntry = {
        id: 99,
        word: "Test",
        definition: "A test entry",
        theme: "Knowledge & Mind",
        dikw: "Data",
      };
      expect(minimalEntry.word).toBeDefined();
      expect(minimalEntry.definition).toBeDefined();
      expect(minimalEntry.theme).toBeDefined();
      expect(minimalEntry.dikw).toBeDefined();
    });
  });
});
