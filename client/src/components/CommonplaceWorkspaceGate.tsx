import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useCommonplaceFeatureFlag } from "@/lib/featureFlags";
import { Sparkles, ToggleLeft } from "lucide-react";

export default function CommonplaceWorkspaceGate({ children }: { children: React.ReactNode }) {
  const utils = trpc.useUtils();
  const { commonplaceEnabled, isLoading } = useCommonplaceFeatureFlag();

  const enableMutation = trpc.featureFlags.update.useMutation({
    onSuccess: async () => {
      await utils.featureFlags.list.invalidate();
    },
  });

  if (isLoading) {
    return (
      <Card className="dev-card rounded-[1.75rem] p-6">
        <p className="text-sm text-muted-foreground">Loading workspace configuration…</p>
      </Card>
    );
  }

  if (commonplaceEnabled) {
    return <>{children}</>;
  }

  return (
    <Card className="dev-card overflow-hidden rounded-[1.9rem] border border-[#13243f]/10 bg-[rgba(255,255,255,0.94)] p-0 shadow-[0_20px_45px_-34px_rgba(19,36,63,0.34)]">
      <div className="h-3 w-full bg-[linear-gradient(90deg,#e85b3e_0%,#efb93a_38%,#56c5ea_74%,#f03878_100%)]" />
      <div className="space-y-5 p-7 sm:p-9">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#13243f]/12 bg-[#fff7f1] px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[#6b7487]">
          <ToggleLeft className="h-4 w-4 text-[#e85b3e]" />
          Feature flag inactive
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl leading-none text-[#13243f] sm:text-5xl">Commonplace is currently turned off</h1>
          <p className="max-w-2xl text-sm leading-7 text-[#5c6578] sm:text-base">
            The Kanban-based Commonplace workspace is behind a runtime feature flag. You can enable it instantly to restore
            the drafting wall, route access, and navigation entry point without redeploying the site.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => enableMutation.mutate({ flagKey: "commonplace_workspace", enabled: true })}
            disabled={enableMutation.isPending}
            className="h-11 rounded-full border border-[#13243f]/15 bg-[#e85b3e] px-5 text-white hover:bg-[#d94d31]"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {enableMutation.isPending ? "Enabling Commonplace…" : "Enable Commonplace workspace"}
          </Button>
          <p className="self-center text-sm text-[#6b7487]">Once enabled, the workspace link will reappear in the sidebar.</p>
        </div>
      </div>
    </Card>
  );
}
