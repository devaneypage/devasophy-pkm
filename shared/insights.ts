export const insightModules = ["document", "commonplace", "idea"] as const;

export type InsightModule = (typeof insightModules)[number];

export type DikwInsightAssessment = {
  tier: "data" | "information" | "knowledge" | "wisdom";
  rationale: string;
};

export type InsightResult = {
  thesis: string;
  keyInsights: string[];
  themes: string[];
  openQuestions: string[];
  suggestedConnections: string[];
  dikwAssessment: DikwInsightAssessment;
  confidenceNote: string;
};

export type InsightExtractionResponse = {
  module: InsightModule;
  recordId: number;
  sourceTitle: string;
  generatedAt: string;
  insights: InsightResult;
};

export type SynthesisRecordReference = {
  module: InsightModule;
  recordId: number;
};

export type SynthesisSource = SynthesisRecordReference & {
  marker: string;
  title: string;
};

export type SynthesisFinding = {
  text: string;
  sourceMarkers: string[];
};

export type MultiRecordSynthesisResult = {
  thesis: string;
  sharedThemes: SynthesisFinding[];
  tensions: SynthesisFinding[];
  emergentConnections: SynthesisFinding[];
  openQuestions: SynthesisFinding[];
  nextMoves: SynthesisFinding[];
  confidenceNote: string;
};

export type MultiRecordSynthesisResponse = {
  sources: SynthesisSource[];
  generatedAt: string;
  synthesis: MultiRecordSynthesisResult;
};
