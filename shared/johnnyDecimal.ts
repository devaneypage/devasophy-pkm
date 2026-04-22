export type JohnnyDecimalCategorySeed = {
  areaNumber: number;
  areaName: string;
  areaDescription: string;
  categoryNumber: string;
  categoryName: string;
  categoryDescription: string;
};

export const johnnyDecimalSeeds: JohnnyDecimalCategorySeed[] = [
  {
    areaNumber: 10,
    areaName: "Commonplace Notebook",
    areaDescription: "Quotations, observations, and captured passages.",
    categoryNumber: "11",
    categoryName: "Quotes & Passages",
    categoryDescription: "Primary quotations, excerpts, and preserved source material.",
  },
  {
    areaNumber: 10,
    areaName: "Commonplace Notebook",
    areaDescription: "Quotations, observations, and captured passages.",
    categoryNumber: "12",
    categoryName: "Observations",
    categoryDescription: "Original observations, reflections, and short-form notes.",
  },
  {
    areaNumber: 10,
    areaName: "Commonplace Notebook",
    areaDescription: "Quotations, observations, and captured passages.",
    categoryNumber: "13",
    categoryName: "Insights",
    categoryDescription: "Interpretive notes and distilled insights from study.",
  },
  {
    areaNumber: 20,
    areaName: "Clavis Aurea",
    areaDescription: "Personal lexicon, etymology, and concordance.",
    categoryNumber: "21",
    categoryName: "Terms",
    categoryDescription: "Core vocabulary entries and glossary items.",
  },
  {
    areaNumber: 20,
    areaName: "Clavis Aurea",
    areaDescription: "Personal lexicon, etymology, and concordance.",
    categoryNumber: "22",
    categoryName: "Etymology",
    categoryDescription: "Word histories, origins, and linguistic development.",
  },
  {
    areaNumber: 20,
    areaName: "Clavis Aurea",
    areaDescription: "Personal lexicon, etymology, and concordance.",
    categoryNumber: "23",
    categoryName: "Concordance",
    categoryDescription: "Related usages, parallels, and term relationships.",
  },
  {
    areaNumber: 30,
    areaName: "Research & Writing Studio",
    areaDescription: "Projects, drafts, and published outputs.",
    categoryNumber: "31",
    categoryName: "Projects",
    categoryDescription: "Active research projects and writing initiatives.",
  },
  {
    areaNumber: 30,
    areaName: "Research & Writing Studio",
    areaDescription: "Projects, drafts, and published outputs.",
    categoryNumber: "32",
    categoryName: "Drafts",
    categoryDescription: "Working drafts, outlines, and in-progress documents.",
  },
  {
    areaNumber: 30,
    areaName: "Research & Writing Studio",
    areaDescription: "Projects, drafts, and published outputs.",
    categoryNumber: "33",
    categoryName: "Published",
    categoryDescription: "Finished essays, posts, or otherwise finalized writing.",
  },
  {
    areaNumber: 40,
    areaName: "Semantic Links",
    areaDescription: "Cross-reference structures and thematic pathways.",
    categoryNumber: "41",
    categoryName: "References",
    categoryDescription: "Direct references between notes, terms, and documents.",
  },
  {
    areaNumber: 40,
    areaName: "Semantic Links",
    areaDescription: "Cross-reference structures and thematic pathways.",
    categoryNumber: "42",
    categoryName: "Themes",
    categoryDescription: "Thematic groupings and recurring conceptual threads.",
  },
  {
    areaNumber: 40,
    areaName: "Semantic Links",
    areaDescription: "Cross-reference structures and thematic pathways.",
    categoryNumber: "43",
    categoryName: "Synthesis",
    categoryDescription: "Integrative connections and synthesized relationships.",
  },
];

export type JohnnyDecimalAreaSummary = {
  areaNumber: number;
  areaName: string;
  areaDescription: string;
};

export function getJohnnyDecimalAreas(): JohnnyDecimalAreaSummary[] {
  const map = new Map<number, JohnnyDecimalAreaSummary>();

  for (const seed of johnnyDecimalSeeds) {
    if (!map.has(seed.areaNumber)) {
      map.set(seed.areaNumber, {
        areaNumber: seed.areaNumber,
        areaName: seed.areaName,
        areaDescription: seed.areaDescription,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.areaNumber - b.areaNumber);
}
