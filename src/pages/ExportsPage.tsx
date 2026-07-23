import { Download, FileJson, FileText, Database } from "lucide-react";
import { api } from "@/lib/api";

export default function ExportsPage() {
  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold mb-1" style={{ color: "var(--navy)" }}>Export & Share</h1>
        <p className="text-[11px] font-sans" style={{ color: "var(--ink-muted)" }}>Distribute insights across the ecosystem in durable formats.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-lg">
        <button onClick={() => api.export.markdown()} className="panel-card p-5 text-left hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "#1B2A4A12" }}>
            <FileText className="w-5 h-5" style={{ color: "#1B2A4A" }} />
          </div>
          <div className="text-[12px] font-semibold font-sans mb-1" style={{ color: "var(--navy)" }}>Markdown</div>
          <div className="text-[9px] font-sans" style={{ color: "var(--ink-muted)" }}>Portable format for all notes and documents</div>
        </button>

        <button onClick={() => api.export.json()} className="panel-card p-5 text-left hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "#C8A84B12" }}>
            <FileJson className="w-5 h-5" style={{ color: "#C8A84B" }} />
          </div>
          <div className="text-[12px] font-semibold font-sans mb-1" style={{ color: "var(--navy)" }}>JSON Backup</div>
          <div className="text-[9px] font-sans" style={{ color: "var(--ink-muted)" }}>Complete data export for backup</div>
        </button>

        <div className="panel-card p-5">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "#4CAF5012" }}>
            <Database className="w-5 h-5" style={{ color: "#4CAF50" }} />
          </div>
          <div className="text-[12px] font-semibold font-sans mb-1" style={{ color: "var(--navy)" }}>Database</div>
          <div className="text-[9px] font-sans" style={{ color: "var(--ink-muted)" }}>MySQL export (admin only)</div>
        </div>

        <button onClick={() => api.seed()} className="panel-card p-5 text-left hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "#E05C4B12" }}>
            <Download className="w-5 h-5" style={{ color: "#E05C4B" }} />
          </div>
          <div className="text-[12px] font-semibold font-sans mb-1" style={{ color: "var(--navy)" }}>Seed Demo Data</div>
          <div className="text-[9px] font-sans" style={{ color: "var(--ink-muted)" }}>Populate with 18 sample artifacts</div>
        </button>
      </div>
    </div>
  );
}
