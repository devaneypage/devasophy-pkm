# Design Critique: Devanomy PKM

**Date:** 2026-04-27  
**Scope:** `client/src` — layout, visual system, interaction patterns, information architecture

---

## 1. Brand identity vs. actual implementation

**Issue:** The README describes "a dark-themed application… deep navy and charcoal backgrounds, warm gold accents." The CSS and components deliver the opposite: a light cream/paper palette (`--devanomy-paper: #fbfaf6`, `--devanomy-cream: #f6f3ec`) with a teal sidebar. Neither is wrong on its own, but the documentation is actively misleading and creates confusion for anyone working on the codebase.

**Recommendation:** Either update the README to describe the actual light design accurately, or commit to the dark aesthetic and update the CSS. If the light variant is intentional, name it clearly ("editorial light mode") and remove all dark-aesthetic references.

---

## 2. Dark mode is completely non-functional

**File:** `client/src/index.css:94–127`

The `.dark { }` block is a byte-for-byte copy of `:root { }`. Every token is identical, so toggling dark mode changes nothing visually. This is currently dead code that suggests dark mode support without providing it.

**Recommendation:** Either implement distinct dark-mode tokens (the design system palette hints at navy/charcoal values that would work well) or remove the `.dark` block entirely until it's ready.

---

## 3. Dashboard stats and tasks are hardcoded

**File:** `client/src/pages/Home.tsx:13–102`

```tsx
const stats = [
  { label: "Active Projects", value: "03", ... },
  { label: "Notes Captured",  value: "48", ... },
  { label: "Terms Tracked",   value: "354", ... },
  { label: "Knowledge Links", value: "126", ... },
];
const tasks = [
  { label: "Review imported quotations", date: "Today", ... },
  ...
];
```

These never change. A user who imports 200 new quotes will still see "48." The Upcoming Tasks panel is purely decorative — none of the tasks come from or write back to any data source. For a PKM tool whose entire value proposition is accurate knowledge accounting, this is a significant trust issue.

**Recommendation:** Wire stats to real `trpc` queries (the server already has the data). Remove the static tasks panel or replace it with a real task/reminder store.

---

## 4. Sidebar navigation has two concrete bugs

**File:** `client/src/components/DashboardLayout.tsx:39–52`

**Bug A — Settings routes to Export:**
```tsx
const utilityItems = [{ icon: Settings2, label: "Settings", path: "/export", ... }];
```
The Settings item opens the Export page. There is no dedicated settings route.

**Bug B — Two entries for effectively the same module:**
```tsx
{ label: "Clavis Aurea", path: "/glossary", accent: "#b55af3" },
{ label: "Lexicon",       path: "/lexicon",  accent: "#9b7e8f" },
```
Both use `VocabularyIcon`. The navigation now has 8 items (Dashboard, Projects, Knowledge Base, Notes, Clavis Aurea, Lexicon, Import, Export), which is too many. The distinction between "Clavis Aurea" and "Lexicon" is unclear to a new user; they appear to be the same concept at different maturity levels.

**Recommendation:** Fix the Settings path. Consolidate Clavis Aurea and Lexicon into one nav item (or clearly differentiate them with distinct icons and sub-labels).

---

## 5. Topbar search is read-only and non-functional

**File:** `client/src/components/DashboardLayout.tsx:321–327`

```tsx
<Input
  readOnly
  value={activeMenuItem?.label === "Dashboard"
    ? "Search your notes, terms, and projects"
    : `Browse ${activeMenuItem?.label.toLowerCase()}`}
  ...
/>
```

The search bar is a decorative prop. It looks interactive — it has a search icon, a pill shape, full width — but clicking or typing does nothing. This is a UX anti-pattern: users will click it expecting a command palette or omnibox, get nothing, and feel confused.

**Recommendation:** Either make it open the `/search` route (or a command-palette overlay) on click/focus, or replace it with a clearly non-interactive breadcrumb.

---

## 6. Favorite button has no event handler

**File:** `client/src/pages/Notebook.tsx:464–467`

```tsx
<button className="...">
  <Heart className={`h-4 w-4 ${entry.favorite ? "fill-[#e25b33] text-[#e25b33]" : "text-black"}`} />
</button>
```

There is no `onClick` on this button. Clicking the heart silently fails. The edit form does carry a `favorite` boolean field, so the backend supports it — it just isn't wired up in the list view.

**Recommendation:** Add an `onClick` that calls `trpc.notebook.update.useMutation` toggling `favorite`. It's a one-liner once the mutation is set up.

---

## 7. Typography scale is oversized for data-dense views

**File:** `client/src/index.css:157–169`

```css
h1 { font-size: clamp(2.6rem, 4vw, 4.6rem); line-height: 0.98; }
h2 { font-size: clamp(2rem, 3vw, 3rem);     line-height: 1.05; }
h3 { @apply text-2xl; }
```

These are headline scales for landing pages. Inside the dashboard, every module page uses `<h1>` for its section header ("Commonplace Notebook", "Clavis Aurea"). At 2.6–4.6rem, those headers dominate the viewport before any content appears. `<h2>` at 2–3rem for "Explore your modules" is similarly large.

The `line-height: 0.98` on h1 is extremely tight — descenders will collide on multi-line wraps.

**Recommendation:** Define a `text-page-title` utility (around 1.8–2.2rem) for use inside module pages, reserving the full h1/h2 scale for marketing or landing contexts. Fix `line-height` to ≥ 1.1.

---

## 8. Form field shape inconsistency within the same form

**File:** `client/src/pages/Notebook.tsx:277–387`

Textarea inputs: `rounded-[1.2rem]`  
Single-line inputs: `rounded-full`

In the same "Create entry" form, the quote textarea has strongly rounded corners, then the Author/Work/Source/Location row below it uses fully-pill-shaped inputs. This alternating rhythm isn't intentional branding — it reads as oversight. Cards also use `rounded-[1.5rem]`, buttons use `rounded-full`, creating three distinct radius values in a single card.

**Recommendation:** Align all form inputs to a single radius (either `rounded-[1.2rem]` for all fields, which preserves the rectangular-yet-friendly feel, or `rounded-xl` for a cleaner scale step).

---

## 9. Entry card color is index-based, not semantic

**File:** `client/src/pages/Notebook.tsx:428–431`

```tsx
<div
  className={`h-4 w-full ${
    index % 3 === 0 ? "dev-pattern-waves" :
    index % 3 === 1 ? "dev-pattern-dots"  : "dev-pattern-stripes"
  }`}
  style={{ backgroundColor: index % 3 === 0 ? "#efb93a" : index % 3 === 1 ? "#56c5ea" : "#e25b33" }}
/>
```

The colored header stripe on each entry card rotates through three colors based on list position alone. If the user re-orders or filters entries, the colors shift randomly. The colors carry no information (type, source, status). The design system has category-based colors available; this is the right slot to use them.

**Recommendation:** Map the color to `entry.sourceType` or the Johnny Decimal category, so the stripe is a visual cue the user can learn to read.

---

## 10. Duplicate user indicators in the topbar

**File:** `client/src/components/DashboardLayout.tsx:329–336`

```tsx
<div className="flex h-12 w-12 ... rounded-full border-2 border-black bg-[#56c5ea] text-black">
  <span className="text-lg font-semibold">d</span>
</div>
<Avatar className="h-12 w-12 border-2 border-black bg-[#f6f3ec]">
  <AvatarFallback ...>{user?.name?.charAt(0).toUpperCase() || "D"}</AvatarFallback>
</Avatar>
```

The topbar shows a hardcoded cyan circle with "d" alongside the user's avatar initial. These are visually adjacent and serve the same role. The cyan circle appears to be a leftover "Devanomy" brand mark that was never converted to an actual logo.

**Recommendation:** Remove the hardcoded cyan "d" circle. The avatar alone is sufficient; add a small Devanomy logo mark elsewhere in the topbar if brand presence is needed.

---

## 11. Module card grid doesn't fit four items into three columns cleanly

**File:** `client/src/pages/Home.tsx:203`

```tsx
<div className="grid gap-6 xl:grid-cols-3">
  {modules.map(...)} {/* 4 items */}
</div>
```

Four items in a 3-column grid always produces an orphaned card in the last row. The fourth card ("Clavis Aurea Glossary") sits alone at full width on large screens, which breaks the visual rhythm. This is compounded by the fact that modules 3 and 4 (Lexicon / Clavis Aurea Glossary) overlap semantically.

**Recommendation:** Either use `xl:grid-cols-4` to fit all four cards, reduce to three modules (consolidating the duplicate vocabulary modules), or use `xl:grid-cols-2` for a two-row balanced layout.

---

## 12. TaxonomySidebar counts are always zero

**File:** `client/src/components/TaxonomySidebar.tsx:16–53`

The `TAXONOMY_STRUCTURE` constant hardcodes `count: 0` for every category. The sidebar renders these counts (or would, once display logic is added), but they'll always be empty. The README promises "entry count badges per category" as a feature.

**Recommendation:** Query `trpc.taxonomy.getTree` (already used in Notebook.tsx for category selection) and derive counts from the live data.

---

## 13. ThemeExplorer uses off-brand Tailwind utility colors

**File:** `client/src/pages/ThemeExplorer.tsx:27–53`

The DIKW hierarchy tiers use `bg-amber-100 text-amber-900`, `bg-orange-100`, `bg-pink-100`, `bg-blue-100` — generic Tailwind palette values that have no relationship to the Devanomy custom palette (`--devanomy-teal`, `--devanomy-coral`, `--devanomy-sky`, etc.).

**Recommendation:** Map tier colors to named custom properties. For example: Wisdom → `var(--devanomy-gold)`, Knowledge → `var(--devanomy-teal)`, Information → `var(--devanomy-sky)`, Data → `var(--devanomy-lime)`.

---

## Summary table

| # | Area | Severity | Effort |
|---|------|----------|--------|
| 1 | Brand identity / README mismatch | Medium | Low |
| 2 | Dark mode non-functional | Medium | Medium |
| 3 | Hardcoded dashboard stats & tasks | High | Medium |
| 4 | Settings → Export bug; duplicate nav items | High | Low |
| 5 | Read-only search bar | High | Low |
| 6 | Favorite button no-op | High | Low |
| 7 | Typography scale too large for data views | Medium | Low |
| 8 | Form field radius inconsistency | Low | Low |
| 9 | Index-based card color stripes | Low | Low |
| 10 | Duplicate user indicator in topbar | Low | Low |
| 11 | 4 modules in 3-column grid | Low | Low |
| 12 | TaxonomySidebar always shows zero counts | Medium | Low |
| 13 | ThemeExplorer uses off-brand colors | Low | Low |

**High-priority quick wins:** items 4, 5, 6 are all low-effort fixes that close actual functional gaps. Item 3 (live stats) is the most impactful but requires connecting queries. Items 1 and 2 are documentation/planning decisions that should be settled before further visual work.
