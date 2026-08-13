import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Wand2 } from "lucide-react";

// DIKW hierarchy colors adapted to Devanomy palette
const DIKW_COLORS = {
  Data: "#9b7e8f",        // Muted violet
  Information: "#b8956a", // Amber-gold
  Knowledge: "#d4a574",   // Warm gold
  Wisdom: "#e8c4a0",      // Light amber
};

const DIKW_ORDER = ["Data", "Information", "Knowledge", "Wisdom"];

// Theme categories with Devanomy-adapted icons and colors
const THEMES = [
  { label: "All Themes", key: "all" },
  { label: "Divine & Sacred", key: "Divine & Sacred", icon: "✦", color: "#d4a574" },
  { label: "Self & Identity", key: "Self & Identity", icon: "◎", color: "#b8956a" },
  { label: "Knowledge & Mind", key: "Knowledge & Mind", icon: "⬡", color: "#9b7e8f" },
  { label: "Language & Words", key: "Language & Words", icon: "✒", color: "#d4a574" },
  { label: "Emotion & Feeling", key: "Emotion & Feeling", icon: "♡", color: "#e8c4a0" },
  { label: "Beauty & Growth", key: "Beauty & Growth", icon: "✿", color: "#b8956a" },
  { label: "Power & Decay", key: "Power & Decay", icon: "⚑", color: "#9b7e8f" },
];

const THEME_ICONS: Record<string, string> = {
  "Divine & Sacred": "✦",
  "Self & Identity": "◎",
  "Knowledge & Mind": "⬡",
  "Language & Words": "✒",
  "Emotion & Feeling": "♡",
  "Beauty & Growth": "✿",
  "Power & Decay": "⚑",
};

// Assign theme heuristically based on word and definition
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

// Assign DIKW tier based on word and definition
function assignDikw(word: string, def: string): string {
  const w = (word + " " + def).toLowerCase();
  if (/wisdom|judg|insight|discern|prudence|philosophi|reflect|contemplat|sage|enlighten/.test(w)) return "Wisdom";
  if (/know|understand|comprehend|concept|principle|theory|reason|logic|epistemi|synthes/.test(w)) return "Knowledge";
  if (/mean|signif|explain|describe|defin|interpret|context|represent|classif/.test(w)) return "Information";
  return "Data";
}

interface GlossaryEntry {
  id: number;
  word: string;
  definition: string;
  partOfSpeech?: string;
  example?: string;
  etymology?: string;
  categoryId?: number;
  theme?: string;
  dikw?: string;
}

export default function Glossary() {
  const [activeTab, setActiveTab] = useState<"Lexicon" | "Scribe">("Lexicon");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("all");
  const [scribeInput, setScribeInput] = useState("");
  const [scribeResult, setScribeResult] = useState("");
  const [scribeLoading, setScribeLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<GlossaryEntry | null>(null);

  // Fetch lexicon entries from database
  const { data: lexiconEntries = [] } = trpc.lexicon.list.useQuery({});
  const composeWithScribe = trpc.glossary.composeWithScribe.useMutation();

  // Transform lexicon entries to glossary format with theme and DIKW assignments
  const glossaryEntries = useMemo(() => {
    return lexiconEntries.map((entry: any) => {
      const word = typeof entry.term === "string"
        ? entry.term
        : typeof entry.word === "string"
          ? entry.word
          : "";
      const definition = typeof entry.definition === "string" ? entry.definition : "";

      return {
        ...entry,
        word,
        definition,
        theme: assignTheme(word, definition),
        dikw: assignDikw(word, definition),
      };
    });
  }, [lexiconEntries]);

  // Filter entries by search and theme
  const filteredEntries = useMemo(() => {
    return glossaryEntries.filter((entry: any) => {
      const matchesSearch =
        entry.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.definition.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTheme = selectedTheme === "all" || entry.theme === selectedTheme;
      return matchesSearch && matchesTheme;
    });
  }, [glossaryEntries, searchTerm, selectedTheme]);

  // Sort entries alphabetically
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a: any, b: any) => a.word.localeCompare(b.word));
  }, [filteredEntries]);

  // Compute insights
  const insights = useMemo(() => {
    const byTheme: Record<string, number> = {};
    const byDikw: Record<string, number> = {};
    glossaryEntries.forEach((entry: any) => {
      byTheme[entry.theme!] = (byTheme[entry.theme!] || 0) + 1;
      byDikw[entry.dikw!] = (byDikw[entry.dikw!] || 0) + 1;
    });
    return { byTheme, byDikw };
  }, [glossaryEntries]);

  // Handle Scribe composition
  const runScribe = async () => {
    if (!scribeInput.trim()) return;
    setScribeLoading(true);
    try {
      const result = await composeWithScribe.mutateAsync({
        prompt: scribeInput,
        glossaryContext: sortedEntries.slice(0, 50).map((e) => `${e.word}: ${e.definition}`).join("; "),
      });
      const composition = typeof result.composition === 'string' ? result.composition : '';
      setScribeResult(composition);
    } catch (error) {
      console.error("Scribe error:", error);
      setScribeResult("An error occurred while composing. Please try again.");
    } finally {
      setScribeLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-[#1a1420] via-[#0f0d0a] to-[#1a1420]">
      {/* Header */}
      <div className="border-b border-[#3d2e4a] bg-[#0f0d0a] px-8 py-6">
        <h1 className="mb-2 text-4xl font-light italic text-[#e8c4a0]" style={{ fontFamily: "'IM Fell English', 'Georgia', serif" }}>
          Clavis Aurea
        </h1>
        <p className="text-sm text-[#9b7e8f]">A curated lexicon of philosophical and literary vocabulary</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-[#3d2e4a] bg-[#0f0d0a] px-8">
        {(["Lexicon", "Scribe"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 text-sm font-semibold uppercase tracking-wider transition ${
              activeTab === tab
                ? "border-b-2 border-[#d4a574] text-[#d4a574]"
                : "text-[#5a4a5a] hover:text-[#9b7e8f]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Lexicon Tab */}
        {activeTab === "Lexicon" && (
          <div className="flex w-full flex-col overflow-hidden">
            {/* Search and Filter */}
            <div className="border-b border-[#3d2e4a] bg-[#0f0d0a] px-8 py-6">
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-[#3d2e4a] bg-[#1a1420] px-4 py-2">
                <Search className="h-4 w-4 text-[#9b7e8f]" />
                <input
                  type="text"
                  placeholder="Search words or definitions…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent text-[#e8c4a0] placeholder-[#5a4a5a] outline-none"
                />
              </div>

              {/* Theme Filter */}
              <div className="flex flex-wrap gap-2">
                {THEMES.map((theme) => (
                  <button
                    key={theme.key}
                    onClick={() => setSelectedTheme(theme.key)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                      selectedTheme === theme.key
                        ? "bg-[#3d2e4a] text-[#d4a574]"
                        : "border border-[#3d2e4a] text-[#9b7e8f] hover:border-[#5a4a5a]"
                    }`}
                  >
                    {theme.icon && <span className="mr-2">{theme.icon}</span>}
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Entries List */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {selectedEntry ? (
                // Detail View
                <div className="max-w-2xl">
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="mb-6 text-sm text-[#9b7e8f] transition hover:text-[#d4a574]"
                  >
                    ← Back to Lexicon
                  </button>
                  <h2 className="mb-4 text-5xl font-light italic text-[#e8c4a0]" style={{ fontFamily: "'IM Fell English', 'Georgia', serif" }}>
                    {selectedEntry.word}
                  </h2>
                  <div className="mb-6 flex flex-wrap gap-3">
                    {selectedEntry.partOfSpeech && (
                      <span className="text-xs italic text-[#9b7e8f]">{selectedEntry.partOfSpeech}</span>
                    )}
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: DIKW_COLORS[selectedEntry.dikw as keyof typeof DIKW_COLORS] }}>
                      {selectedEntry.dikw}
                    </span>
                    <span className="text-xs text-[#9b7e8f]">
                      {THEME_ICONS[selectedEntry.theme!]} {selectedEntry.theme}
                    </span>
                  </div>
                  <div className="mb-6 border-t border-[#3d2e4a] pt-6">
                    <p className="text-lg leading-relaxed text-[#cfc0a0]">{selectedEntry.definition}</p>
                  </div>
                  {selectedEntry.example && (
                    <blockquote className="mb-6 border-l-2 border-[#3d2e4a] bg-[#1a1420] px-4 py-3 italic text-[#9b7e8f]">
                      "{selectedEntry.example}"
                    </blockquote>
                  )}
                  {selectedEntry.etymology && (
                    <div className="text-xs text-[#5a4a5a]">
                      <p className="mb-2 font-semibold uppercase tracking-wider">Etymology</p>
                      <p>{selectedEntry.etymology}</p>
                    </div>
                  )}
                </div>
              ) : (
                // List View
                <div className="grid gap-3">
                  {sortedEntries.length > 0 ? (
                    sortedEntries.map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => setSelectedEntry(entry)}
                        className="rounded-lg border border-[#3d2e4a] bg-[#1a1420] p-4 text-left transition hover:border-[#5a4a5a] hover:bg-[#2a1f2a]"
                      >
                        <div className="mb-2 text-lg italic text-[#d4a574]" style={{ fontFamily: "'IM Fell English', 'Georgia', serif" }}>
                          {entry.word}
                        </div>
                        <div className="mb-2 text-sm text-[#9b7e8f] line-clamp-2">{entry.definition}</div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span style={{ color: DIKW_COLORS[entry.dikw as keyof typeof DIKW_COLORS] }} className="font-semibold uppercase tracking-wider">
                            {entry.dikw}
                          </span>
                          <span className="text-[#5a4a5a]">{THEME_ICONS[entry.theme!]} {entry.theme}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-[#5a4a5a]">No entries found. Try adjusting your search or filter.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scribe Tab */}
        {activeTab === "Scribe" && (
          <div className="w-full overflow-y-auto px-8 py-6">
            <div className="max-w-2xl">
              <h2 className="mb-4 text-3xl font-light italic text-[#d4a574]" style={{ fontFamily: "'IM Fell English', 'Georgia', serif" }}>
                ✒ Writing Scribe
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-[#9b7e8f]">
                The Scribe will compose a polished passage weaving in Clavis Aurea vocabulary. Describe what you wish to write, and let the lexicon speak.
              </p>

              <textarea
                value={scribeInput}
                onChange={(e) => setScribeInput(e.target.value)}
                placeholder="Write a meditation on the nature of forgetting and identity…&#10;Draft an aphorism about the relationship between silence and wisdom…&#10;Compose an opening sentence for a philosophical essay on finitude…"
                className="mb-4 w-full rounded-lg border border-[#3d2e4a] bg-[#1a1420] p-4 text-[#e8c4a0] placeholder-[#5a4a5a] outline-none"
                rows={6}
              />

              <div className="mb-6 flex gap-3">
                <button
                  onClick={runScribe}
                  disabled={scribeLoading || !scribeInput.trim()}
                  className="flex items-center gap-2 rounded-lg border border-[#d4a574] bg-[#2a1f2a] px-6 py-3 text-sm font-semibold uppercase tracking-wider text-[#d4a574] transition disabled:opacity-50"
                >
                  <Wand2 className="h-4 w-4" />
                  {scribeLoading ? "Composing…" : "Compose ✦"}
                </button>
                {scribeResult && !scribeLoading && (
                  <button
                    onClick={() => {
                      setScribeInput("");
                      setScribeResult("");
                    }}
                    className="rounded-lg border border-[#3d2e4a] px-6 py-3 text-sm text-[#9b7e8f] transition hover:border-[#5a4a5a]"
                  >
                    Clear
                  </button>
                )}
              </div>

              {scribeResult && (
                <div className="rounded-lg border-l-4 border-[#d4a574] bg-[#1a1420] p-6">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#d4a574]">Scribe</p>
                  <p className="whitespace-pre-wrap text-lg leading-relaxed text-[#cfc0a0]" style={{ fontFamily: "'IM Fell English', 'Georgia', serif" }}>
                    {scribeResult}
                  </p>
                </div>
              )}

              {!scribeResult && !scribeLoading && (
                <div className="mt-8">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#5a4a5a]">Try asking the Scribe to…</p>
                  <div className="space-y-2">
                    {[
                      "Write a meditation on the relationship between knowledge and forgetting",
                      "Compose an aphorism about wisdom and silence",
                      "Draft an opening for an essay on the sublime and human finitude",
                      "Write a short prose poem about liminality and transformation",
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => setScribeInput(prompt)}
                        className="block w-full rounded-lg border border-[#3d2e4a] bg-[#1a1420] p-3 text-left text-sm italic text-[#9b7e8f] transition hover:border-[#5a4a5a] hover:text-[#d4a574]"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
