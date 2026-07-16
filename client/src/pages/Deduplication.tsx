import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Archive, GitMerge, RefreshCw, Trash2 } from "lucide-react";

type ActionType = "merge" | "archive" | "delete";

const moduleLabels: Record<string, string> = {
  commonplace: "Commonplace",
  lexicon: "Lexicon",
  book: "Books",
  document: "Notes",
  idea: "Ideas",
};

const actionMeta: Record<ActionType, { label: string; icon: typeof GitMerge; tone: string }> = {
  merge: { label: "Merge", icon: GitMerge, tone: "#5c61ff" },
  archive: { label: "Archive", icon: Archive, tone: "#efb93a" },
  delete: { label: "Delete", icon: Trash2, tone: "#e25b33" },
};

function formatBasis(value: string) {
  return value.replace(/_/g, " ");
}

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default function Deduplication() {
  const [selectedCanonicals, setSelectedCanonicals] = useState<Record<string, string>>({});
  const [selectedTargets, setSelectedTargets] = useState<Record<string, string[]>>({});
  const [selectedActions, setSelectedActions] = useState<Record<string, ActionType>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const groupsQuery = trpc.deduplication.scan.useQuery();
  const resolveMutation = trpc.deduplication.resolve.useMutation({
    onSuccess: (result) => {
      setStatusMessage(`Applied ${result.action} to ${result.targetKeys.length} duplicate record${result.targetKeys.length === 1 ? "" : "s"}.`);
      void groupsQuery.refetch();
    },
    onError: (error) => {
      setStatusMessage(error.message);
    },
  });

  const groups = groupsQuery.data ?? [];

  const summary = useMemo(() => {
    const totalRecords = groups.reduce((count, group) => count + group.records.length, 0);
    const sameModuleGroups = groups.filter((group) => group.sameModule).length;
    const crossModuleGroups = groups.length - sameModuleGroups;
    return { totalRecords, sameModuleGroups, crossModuleGroups };
  }, [groups]);

  const getCanonicalKey = (group: any) => selectedCanonicals[group.id] ?? group.suggestedCanonicalKey;
  const getAction = (group: any): ActionType => selectedActions[group.id] ?? (group.sameModule ? "merge" : "archive");
  const getTargetKeys = (group: any) => {
    const stored = selectedTargets[group.id];
    const canonicalKey = getCanonicalKey(group);
    return stored ?? group.records.filter((record: any) => record.dedupKey !== canonicalKey).map((record: any) => record.dedupKey);
  };

  const setCanonical = (group: any, dedupKey: string) => {
    setSelectedCanonicals((current) => ({ ...current, [group.id]: dedupKey }));
    setSelectedTargets((current) => ({
      ...current,
      [group.id]: group.records.filter((record: any) => record.dedupKey !== dedupKey).map((record: any) => record.dedupKey),
    }));
  };

  const toggleTarget = (groupId: string, dedupKey: string) => {
    setSelectedTargets((current) => {
      const existing = current[groupId] ?? [];
      const next = existing.includes(dedupKey)
        ? existing.filter((key) => key !== dedupKey)
        : [...existing, dedupKey];
      return { ...current, [groupId]: next };
    });
  };

  const applyAction = async (group: any) => {
    const canonicalKey = getCanonicalKey(group);
    const action = getAction(group);
    const targetKeys = getTargetKeys(group).filter((key: string) => key !== canonicalKey);

    if (targetKeys.length === 0) {
      setStatusMessage("Select at least one non-canonical record before applying an action.");
      return;
    }

    await resolveMutation.mutateAsync({
      canonicalKey,
      targetKeys,
      action,
    });
  };

  return (
    <div className="space-y-6">
      <section className="dev-soft-card p-6 sm:p-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Knowledge hygiene workspace</p>
        <h1 className="mb-4">Deduplication Tool</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          Review likely duplicate records across Commonplace, Lexicon, Books, Notes, and Ideas. Same-module matches can be merged,
          while cross-module matches support canonical keep plus archive or delete actions.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Card className="dev-card rounded-[1.5rem] p-6 shadow-none">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Current scan</p>
                <h2 className="mt-2 text-[1.9rem] leading-none">{groups.length} duplicate group{groups.length === 1 ? "" : "s"}</h2>
              </div>
              <Button
                onClick={() => void groupsQuery.refetch()}
                disabled={groupsQuery.isFetching}
                className="h-11 rounded-full border-2 border-black bg-[#13243f] px-5 text-white shadow-none hover:bg-[#0f1c31]"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${groupsQuery.isFetching ? "animate-spin" : ""}`} />
                Rescan workspace
              </Button>
            </div>
          </Card>

          {statusMessage && (
            <Card className="dev-card rounded-[1.5rem] border-l-4 border-[#56c5ea] p-5 shadow-none">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-[#56c5ea]" />
                <p className="text-sm leading-6 text-foreground">{statusMessage}</p>
              </div>
            </Card>
          )}

          {groupsQuery.isLoading ? (
            <Card className="dev-card rounded-[1.5rem] p-6 shadow-none">
              <p className="text-sm text-muted-foreground">Scanning the eligible modules for likely duplicates…</p>
            </Card>
          ) : groupsQuery.error ? (
            <Card className="dev-card rounded-[1.5rem] border-l-4 border-red-500 p-6 shadow-none">
              <p className="text-sm font-semibold text-red-700">Unable to complete the duplicate scan.</p>
              <p className="mt-2 text-sm text-red-600">{groupsQuery.error.message}</p>
            </Card>
          ) : groups.length === 0 ? (
            <Card className="dev-card rounded-[1.5rem] p-6 shadow-none">
              <p className="text-sm text-muted-foreground">No duplicate groups were found using the current module rules.</p>
            </Card>
          ) : (
            groups.map((group: any) => {
              const canonicalKey = getCanonicalKey(group);
              const action = getAction(group);
              const targetKeys = getTargetKeys(group);
              const hasUnarchivableTarget = action === "archive"
                && targetKeys.some((key: string) => group.records.find((record: any) => record.dedupKey === key && !record.archivable));
              const actionDisabled = resolveMutation.isPending || targetKeys.length === 0 || hasUnarchivableTarget || (action === "merge" && !group.sameModule);
              const ActionIcon = actionMeta[action].icon;

              return (
                <Card key={group.id} className="dev-card rounded-[1.5rem] p-6 shadow-none">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-[#13243f] text-white">{formatConfidence(group.confidence)}</Badge>
                        <Badge variant="outline">{group.sameModule ? "Same module" : "Cross module"}</Badge>
                        {group.bases.map((basis: string) => (
                          <Badge key={basis} variant="outline" className="capitalize">{formatBasis(basis)}</Badge>
                        ))}
                      </div>
                      <h3 className="mt-3 text-[1.55rem] leading-none">Duplicate Group {group.id.replace("dedup-group-", "")}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Choose one canonical record, then merge, archive, or delete the remaining duplicates according to the allowed action model.
                      </p>
                    </div>
                    <div className="rounded-[1.2rem] border border-black/10 bg-[#f6f1e8] px-4 py-3 text-sm text-muted-foreground">
                      <p><span className="font-semibold text-foreground">Records:</span> {group.records.length}</p>
                      <p><span className="font-semibold text-foreground">Actions:</span> {group.allowedActions.join(", ")}</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    {group.records.map((record: any) => {
                      const isCanonical = canonicalKey === record.dedupKey;
                      const isTarget = targetKeys.includes(record.dedupKey);
                      return (
                        <div key={record.dedupKey} className={`rounded-[1.3rem] border p-4 ${isCanonical ? "border-[#13243f] bg-[#f8f5ef]" : "border-black/10 bg-white"}`}>
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">{moduleLabels[record.module] ?? record.module}</Badge>
                                {record.entryType ? <Badge variant="outline">{formatBasis(record.entryType)}</Badge> : null}
                                {record.zettelkastenId ? <Badge variant="outline">{record.zettelkastenId}</Badge> : null}
                                {record.uuid ? <Badge variant="outline">uuid</Badge> : null}
                                {!record.archivable ? <Badge variant="outline">No archive action</Badge> : null}
                              </div>
                              <p className="mt-3 text-lg font-semibold text-foreground">{record.label}</p>
                              {record.author ? <p className="mt-1 text-sm text-muted-foreground">{record.author}</p> : null}
                              {record.body ? <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">{record.body}</p> : null}
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                type="button"
                                variant={isCanonical ? "default" : "outline"}
                                className="rounded-full"
                                onClick={() => setCanonical(group, record.dedupKey)}
                              >
                                Keep as canonical
                              </Button>
                              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                <input
                                  type="checkbox"
                                  checked={isTarget}
                                  disabled={isCanonical}
                                  onChange={() => toggleTarget(group.id, record.dedupKey)}
                                />
                                Select as target
                              </label>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 rounded-[1.3rem] border border-black/10 bg-[#fdfaf4] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Resolution</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {(group.sameModule ? (["merge", "archive", "delete"] as ActionType[]) : (["archive", "delete"] as ActionType[])).map((option) => {
                        const Icon = actionMeta[option].icon;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setSelectedActions((current) => ({ ...current, [group.id]: option }))}
                            className={`rounded-full border-2 border-black px-4 py-2 text-sm font-semibold transition ${action === option ? "-translate-y-0.5 bg-white" : "bg-transparent hover:-translate-y-0.5"}`}
                            style={{ boxShadow: action === option ? `0 0 0 2px ${actionMeta[option].tone} inset` : undefined }}
                          >
                            <span className="inline-flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {actionMeta[option].label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {hasUnarchivableTarget ? (
                      <p className="mt-3 text-sm text-[#b45309]">Archive is unavailable for one or more selected targets in this group. Choose delete or change the targets.</p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        Canonical: <span className="font-semibold text-foreground">{group.records.find((record: any) => record.dedupKey === canonicalKey)?.label ?? "Not selected"}</span>
                      </p>
                      <Button
                        onClick={() => void applyAction(group)}
                        disabled={actionDisabled}
                        className="h-11 rounded-full border-2 border-black bg-[#116d6d] px-5 text-white shadow-none hover:bg-[#0f5959]"
                      >
                        <ActionIcon className="mr-2 h-4 w-4" />
                        {resolveMutation.isPending ? "Applying..." : `Apply ${actionMeta[action].label.toLowerCase()}`}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <aside className="space-y-6">
          <Card className="dev-card rounded-[1.5rem] p-5 shadow-none">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Workspace summary</p>
            <div className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p><span className="font-semibold text-foreground">Records involved:</span> {summary.totalRecords}</p>
              <p><span className="font-semibold text-foreground">Same-module groups:</span> {summary.sameModuleGroups}</p>
              <p><span className="font-semibold text-foreground">Cross-module groups:</span> {summary.crossModuleGroups}</p>
            </div>
          </Card>

          <Card className="dev-card rounded-[1.5rem] p-5 shadow-none">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Rules in force</p>
            <div className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>Commonplace compares title and extracted content, with metadata-based Zettelkasten matches when available.</p>
              <p>Lexicon compares term and definition; Books compare title and author; Notes and Ideas compare title plus body text, with same-module UUID support where available.</p>
              <p>Cross-module matches do not merge. They require one canonical record and then archive or delete actions for the remaining records.</p>
            </div>
          </Card>
        </aside>
      </section>
    </div>
  );
}
