import React from "react";
import { Download, SlidersHorizontal, Upload, UserRound } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/../src/_core/hooks/useAuth";

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [workspaceName, setWorkspaceName] = React.useState("Devanomy");
  const [workspaceIntent, setWorkspaceIntent] = React.useState("A personal knowledge system for synthesis, editorial thinking, and instructional architecture.");
  const [preferences, setPreferences] = React.useState({
    compactCards: true,
    showEditorialPrompts: true,
    emphasizeDeadlines: true,
  });

  return (
    <div className="space-y-6">
      <section className="dev-soft-card p-6 sm:p-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Workspace administration</p>
        <h1 className="mb-4">Settings</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          Adjust identity, interface preferences, and workspace defaults from a dedicated launchpad surface, while keeping import and export as nested operational tools rather than primary navigation.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Card className="dev-card rounded-[1.8rem] p-6 shadow-none">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-[#f6d3df]">
                <UserRound className="h-5 w-5 text-[#13243f]" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Account</p>
                <h2 className="mt-1 text-2xl text-foreground">Identity and access</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.3rem] border border-black/10 bg-[#fcfaf6] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Display name</p>
                <p className="mt-2 text-base font-semibold text-foreground">{user?.name || "Devaney"}</p>
              </div>
              <div className="rounded-[1.3rem] border border-black/10 bg-[#fcfaf6] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Email</p>
                <p className="mt-2 text-base font-semibold text-foreground">{user?.email || "Personal workspace"}</p>
              </div>
            </div>
          </Card>

          <Card className="dev-card rounded-[1.8rem] p-6 shadow-none">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-[#d8ecfb]">
                <SlidersHorizontal className="h-5 w-5 text-[#13243f]" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Preferences</p>
                <h2 className="mt-1 text-2xl text-foreground">Interface defaults</h2>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {[
                { key: "compactCards", label: "Compact card density", description: "Reduce vertical spacing across dashboard cards and lists." },
                { key: "showEditorialPrompts", label: "Editorial prompts", description: "Keep contextual prompts visible inside dashboard and notes surfaces." },
                { key: "emphasizeDeadlines", label: "Deadline emphasis", description: "Highlight due dates more strongly inside the calendar and project views." },
              ].map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-4 rounded-[1.3rem] border border-black/10 bg-[#fcfaf6] p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch
                    checked={preferences[item.key as keyof typeof preferences]}
                    onCheckedChange={(checked) => setPreferences((current) => ({ ...current, [item.key]: checked }))}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="dev-card rounded-[1.8rem] p-6 shadow-none">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Workspace</p>
            <h2 className="mt-2 text-2xl text-foreground">Identity and orientation</h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Workspace name</label>
                <Input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} className="rounded-2xl border-black/10 bg-[#fcfaf6]" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Editorial intent</label>
                <Textarea value={workspaceIntent} onChange={(event) => setWorkspaceIntent(event.target.value)} rows={4} className="rounded-[1.4rem] border-black/10 bg-[#fcfaf6]" />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="dev-card rounded-[1.8rem] p-5 shadow-none">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Nested tools</p>
            <div className="mt-4 grid gap-3">
              <Button variant="outline" className="justify-start rounded-2xl border-black/10 bg-[#fcfaf6]" onClick={() => setLocation("/bulk-import")}>
                <Upload className="mr-2 h-4 w-4" />
                Open import workspace
              </Button>
              <Button variant="outline" className="justify-start rounded-2xl border-black/10 bg-[#fcfaf6]" onClick={() => setLocation("/export")}>
                <Download className="mr-2 h-4 w-4" />
                Open export workspace
              </Button>
            </div>
          </Card>

          <Card className="dev-card rounded-[1.8rem] p-5 shadow-none">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Workspace snapshot</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <p>The settings surface centralizes account-level details while keeping archival operations nested one level deeper.</p>
              <p>Use the launchpad sidebar for top-level movement, then step into import or export only when you need to manage archival intake or output.</p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
