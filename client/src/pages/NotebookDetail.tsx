import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Bookmark, Heart, Link2, MoreHorizontal, Plus, Share2 } from "lucide-react";

const DETAIL_TABS = ["NOTES", "CONTEXT", "LINKS", "MENTIONS"] as const;
type DetailTab = (typeof DETAIL_TABS)[number];

function PillTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/10 bg-black/4 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-black/60">
      {label}
    </span>
  );
}

function LinkedNoteRow({ jdCode, title }: { jdCode: string; title: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/2">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#E84D20]/10">
        <Link2 className="h-3.5 w-3.5 text-[#E84D20]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-black/40 uppercase tracking-[0.1em]">{jdCode}</p>
        <p className="truncate text-sm font-medium text-black">{title}</p>
      </div>
    </div>
  );
}

export default function NotebookDetail() {
  const [, params] = useRoute("/notebook/:id");
  const [, setLocation] = useLocation();
  const entryId = params?.id ? parseInt(params.id) : null;

  const [activeTab, setActiveTab] = useState<DetailTab>("NOTES");
  const [isEditing, setIsEditing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [editData, setEditData] = useState({
    text: "",
    author: "",
    work: "",
    sourceType: "",
    location: "",
    note: "",
    tags: "",
  });

  const { data: entry, isLoading } = trpc.notebook.get.useQuery(
    { id: entryId! },
    { enabled: entryId !== null }
  );

  const updateMutation = trpc.notebook.update.useMutation({
    onSuccess: () => setIsEditing(false),
  });

  const { data: linkedEntries } = trpc.links.list.useQuery(
    { sourceType: "notebook", sourceId: entryId! },
    { enabled: entryId !== null }
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E84D20] border-t-transparent" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
        <p className="text-sm text-black/40">Entry not found</p>
        <button
          onClick={() => setLocation("/notes")}
          className="text-xs font-bold uppercase tracking-[0.15em] text-[#E84D20]"
        >
          Back to Notes
        </button>
      </div>
    );
  }

  const handleSave = () => {
    if (entryId) {
      updateMutation.mutate({ id: entryId, ...editData });
    }
  };

  // Parse tags
  const tagList = entry.tags
    ? entry.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  // Zettelkasten ID display
  const zid = entry.zettelkastenId || "";

  // Cluster title
  const clusterTitle = entry.author
    ? `${entry.author} Quotations Cluster`
    : entry.work || "Notebook Entry";

  // Breadcrumb JD label
  const breadcrumb = entry.collections || "30.02 QUOTATIONS BY AUTHOR";

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-black/8 bg-white px-4 py-4">
        <button
          onClick={() => setLocation("/notes")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10"
        >
          <ArrowLeft className="h-4 w-4 text-black" />
        </button>
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-black/50">{breadcrumb}</p>
        <button className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10">
          <MoreHorizontal className="h-4 w-4 text-black" />
        </button>
      </div>

      {/* Title block */}
      <div className="px-5 pt-5 pb-4">
        <h1 className="text-xl font-black leading-tight text-black">{clusterTitle}</h1>
        {zid && (
          <p className="mt-1 text-xs font-medium" style={{ color: "#F16A43" }}>{zid}</p>
        )}
      </div>

      {/* Pill tags */}
      {tagList.length > 0 && (
        <div className="flex flex-wrap gap-2 px-5 pb-4">
          {tagList.map((tag) => (
            <PillTag key={tag} label={tag} />
          ))}
          <button className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-black/15 text-black/40">
            <Plus className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Featured quote block */}
      <div className="mx-4 mb-5 overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
        <div className="border-l-4 border-[#E84D20] p-5">
          <span className="text-5xl font-black leading-none text-[#E84D20]">"</span>
          <p className="mt-2 text-base font-medium leading-relaxed text-black">{entry.text}</p>
          {entry.author && (
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
              — {entry.author}
              {entry.work ? `, ${entry.work}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Social actions row */}
      <div className="flex items-center gap-4 border-b border-black/6 px-5 pb-4">
        <button
          onClick={() => setLiked(!liked)}
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${liked ? "text-red-500" : "text-black/40"}`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
          <span>23</span>
        </button>
        <button
          onClick={() => setBookmarked(!bookmarked)}
          className={`flex items-center justify-center transition-colors ${bookmarked ? "text-[#E84D20]" : "text-black/40"}`}
        >
          <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-[#E84D20] text-[#E84D20]" : ""}`} />
        </button>
        <button className="text-black/40 transition-colors hover:text-black">
          <Link2 className="h-4 w-4" />
        </button>
        <button className="text-black/40 transition-colors hover:text-black">
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-black/8 bg-white">
        {DETAIL_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs font-bold tracking-[0.12em] transition-colors ${
              activeTab === tab
                ? "border-b-2 border-[#E84D20] text-[#E84D20]"
                : "text-black/40 hover:text-black/70"
            }`}
          >
            {tab}
            {tab === "LINKS" && linkedEntries && linkedEntries.length > 0 && (
              <span className="ml-1 text-[0.6rem]">({linkedEntries.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-4 pt-4">
        {activeTab === "NOTES" && (
          <div>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-black/60">Quote text</label>
                  <Textarea
                    value={editData.text}
                    onChange={(e) => setEditData({ ...editData, text: e.target.value })}
                    className="h-28 rounded-xl border-black/15 bg-black/3 text-black"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-black/60">Author</label>
                    <Input
                      value={editData.author}
                      onChange={(e) => setEditData({ ...editData, author: e.target.value })}
                      className="rounded-xl border-black/15 bg-black/3 text-black"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-black/60">Work</label>
                    <Input
                      value={editData.work}
                      onChange={(e) => setEditData({ ...editData, work: e.target.value })}
                      className="rounded-xl border-black/15 bg-black/3 text-black"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-black/60">Tags (comma-separated)</label>
                  <Input
                    value={editData.tags}
                    onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
                    className="rounded-xl border-black/15 bg-black/3 text-black"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-black/60">Notes</label>
                  <Textarea
                    value={editData.note}
                    onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                    className="h-20 rounded-xl border-black/15 bg-black/3 text-black"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="flex-1 rounded-xl bg-[#E84D20] py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                  >
                    {updateMutation.isPending ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="rounded-xl border border-black/15 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-black/60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {entry.note ? (
                  <p className="text-sm leading-relaxed text-black/70 whitespace-pre-wrap">{entry.note}</p>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <p className="text-sm text-black/40">No notes yet on this entry.</p>
                    <button
                      onClick={() => {
                        setEditData({
                          text: entry.text,
                          author: entry.author || "",
                          work: entry.work || "",
                          sourceType: entry.sourceType || "",
                          location: entry.location || "",
                          note: entry.note || "",
                          tags: entry.tags || "",
                        });
                        setIsEditing(true);
                      }}
                      className="text-xs font-bold uppercase tracking-[0.15em] text-[#E84D20]"
                    >
                      Add a note
                    </button>
                  </div>
                )}
                {/* Metadata row */}
                <div className="mt-5 space-y-2">
                  {entry.work && (
                    <div className="flex items-center gap-3">
                      <span className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-black/30 w-20">Work</span>
                      <span className="text-sm text-black/70">{entry.work}</span>
                    </div>
                  )}
                  {entry.sourceType && (
                    <div className="flex items-center gap-3">
                      <span className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-black/30 w-20">Source</span>
                      <span className="text-sm text-black/70">{entry.sourceType}</span>
                    </div>
                  )}
                  {entry.location && (
                    <div className="flex items-center gap-3">
                      <span className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-black/30 w-20">Location</span>
                      <span className="text-sm text-black/70">{entry.location}</span>
                    </div>
                  )}
                  {entry.createdAt && (
                    <div className="flex items-center gap-3">
                      <span className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-black/30 w-20">Added</span>
                      <span className="text-sm text-black/70">
                        {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "CONTEXT" && (
          <div className="py-4 text-center text-sm text-black/40">
            Context about this entry will appear here.
          </div>
        )}

        {activeTab === "LINKS" && (
          <div>
            {/* Linked Notes section */}
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.25em] text-black/40">Linked Notes</p>
              <button className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-[#E84D20]">View All</button>
            </div>
            <div className="divide-y divide-black/6 overflow-hidden rounded-2xl border border-black/8 bg-white">
              {linkedEntries && linkedEntries.length > 0 ? (
                linkedEntries.map((link: any) => (
                  <LinkedNoteRow
                    key={link.id}
                    jdCode={link.targetType === "notebook" ? "30.01" : link.targetType === "lexicon" ? "20.01" : "40.01"}
                    title={`${link.targetType} — ${link.linkType || "related"}`}
                  />
                ))
              ) : (
                <div className="px-4 py-8 text-center text-sm text-black/40">No linked notes yet.</div>
              )}
            </div>

            {/* Static linked note examples from the mockup */}
            {(!linkedEntries || linkedEntries.length === 0) && (
              <div className="mt-4 divide-y divide-black/6 overflow-hidden rounded-2xl border border-black/8 bg-white opacity-40">
                <LinkedNoteRow jdCode="40.01" title="Life Design: Principles & Practice" />
                <LinkedNoteRow jdCode="50.03" title="Teleology & Purpose in Life" />
              </div>
            )}
          </div>
        )}

        {activeTab === "MENTIONS" && (
          <div className="py-4 text-center text-sm text-black/40">
            Mentions of this entry across your knowledge base will appear here.
          </div>
        )}
      </div>

      {/* Capture Thought full-width button */}
      <div className="fixed bottom-16 left-0 right-0 z-40 bg-white px-4 pb-4 pt-2">
        <button
          onClick={() => {
            setEditData({
              text: entry.text,
              author: entry.author || "",
              work: entry.work || "",
              sourceType: entry.sourceType || "",
              location: entry.location || "",
              note: entry.note || "",
              tags: entry.tags || "",
            });
            setIsEditing(true);
            setActiveTab("NOTES");
          }}
          className="w-full rounded-2xl bg-[#E84D20] py-4 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-md shadow-[#E84D20]/20 transition hover:bg-[#d43b10]"
        >
          Capture Thought
        </button>
      </div>
    </div>
  );
}
