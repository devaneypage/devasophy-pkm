import { useAuth } from "@/hooks/useAuth";
import { User, Palette, Database, HardDrive, Info } from "lucide-react";

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold mb-1" style={{ color: "var(--navy)" }}>Settings</h1>
        <p className="text-[11px] font-sans" style={{ color: "var(--ink-muted)" }}>Configure your atelier preferences.</p>
      </div>

      <div className="max-w-lg space-y-4">
        {/* Account */}
        <div className="panel-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4" style={{ color: "var(--coral)" }} />
            <h3 className="text-[10px] font-bold uppercase tracking-[1.5px] font-sans" style={{ color: "var(--ink-light)" }}>Account</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-1">
              <span className="text-[11px] font-sans" style={{ color: "var(--ink-light)" }}>Email</span>
              <span className="text-[11px] font-sans" style={{ color: "var(--ink-muted)" }}>{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[11px] font-sans" style={{ color: "var(--ink-light)" }}>Name</span>
              <span className="text-[11px] font-sans" style={{ color: "var(--ink-muted)" }}>{user?.name || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[11px] font-sans" style={{ color: "var(--ink-light)" }}>Role</span>
              <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full font-sans" style={{ background: "var(--cream-dark)", color: "var(--ink-muted)" }}>{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="panel-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4" style={{ color: "var(--amber)" }} />
            <h3 className="text-[10px] font-bold uppercase tracking-[1.5px] font-sans" style={{ color: "var(--ink-light)" }}>Appearance</h3>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-[11px] font-sans" style={{ color: "var(--ink-light)" }}>Theme</span>
            <span className="text-[11px] font-sans" style={{ color: "var(--ink-muted)" }}>Cream (default)</span>
          </div>
        </div>

        {/* Data */}
        <div className="panel-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4" style={{ color: "var(--sky)" }} />
            <h3 className="text-[10px] font-bold uppercase tracking-[1.5px] font-sans" style={{ color: "var(--ink-light)" }}>Data</h3>
          </div>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 rounded-lg text-[11px] font-sans hover:bg-[var(--cream-dark)] transition-colors" style={{ color: "var(--ink-light)" }}>
              Export all data as JSON
            </button>
            <button className="w-full text-left px-3 py-2 rounded-lg text-[11px] font-sans hover:bg-[var(--cream-dark)] transition-colors" style={{ color: "var(--ink-light)" }}>
              Export as Markdown
            </button>
          </div>
        </div>

        {/* About */}
        <div className="panel-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4" style={{ color: "var(--navy)" }} />
            <h3 className="text-[10px] font-bold uppercase tracking-[1.5px] font-sans" style={{ color: "var(--ink-light)" }}>About</h3>
          </div>
          <div className="space-y-1 text-[11px] font-sans" style={{ color: "var(--ink-muted)" }}>
            <p>Devasophy PKM v4.2</p>
            <p>A philosopher's atelier ecosystem</p>
            <p>Evolved from Devanomy</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full h-10 rounded-lg text-[12px] font-medium font-sans transition-all hover:opacity-90"
          style={{ background: "var(--coral-light)", color: "var(--coral)" }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
