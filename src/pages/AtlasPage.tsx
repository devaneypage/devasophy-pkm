import { useRef, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

const dikwColors: Record<string, string> = { data: "#3B82F6", information: "#10B981", knowledge: "#C8A84B", wisdom: "#7B5EA7" };

interface Node { id: number; label: string; type: string; tier: string; x: number; y: number; vx: number; vy: number; r: number; }
interface Edge { source: number; target: number; }

export default function AtlasPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<Node | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    canvas.width = w * window.devicePixelRatio;
    canvas.height = h * window.devicePixelRatio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    let cancelled = false;

    Promise.all([api.notes.list(), api.quotations.list(), api.vocabulary.list()]).then(([notes, quotes, vocab]) => {
      if (cancelled) return;
      const all = [
        ...notes.map((n: any) => ({ id: n.id, label: n.title?.slice(0, 12) ?? "?", type: n.entryType ?? "note", tier: n.dikwTier ?? "information" })),
        ...quotes.map((q: any) => ({ id: q.id + 10000, label: q.author?.slice(0, 12) ?? "?", type: "quotation", tier: q.dikwTier ?? "wisdom" })),
        ...vocab.map((v: any) => ({ id: v.id + 20000, label: v.headword?.slice(0, 12) ?? "?", type: "lexicon", tier: v.dikwTier ?? "knowledge" })),
      ];

      nodesRef.current = all.map((item) => ({ id: item.id, label: item.label, type: item.type, tier: item.tier, x: w / 2 + (Math.random() - 0.5) * w * 0.6, y: h / 2 + (Math.random() - 0.5) * h * 0.6, vx: 0, vy: 0, r: 9 }));

      const edges: Edge[] = [];
      const nodes = nodesRef.current;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < Math.min(i + 4, nodes.length); j++) {
          if (Math.random() > 0.4) edges.push({ source: nodes[i].id, target: nodes[j].id });
        }
      }
      edgesRef.current = edges;

      const loop = () => {
        if (cancelled) return;
        const ns = nodesRef.current, es = edgesRef.current;
        for (let i = 0; i < ns.length; i++) {
          for (let j = i + 1; j < ns.length; j++) {
            const dx = ns[j].x - ns[i].x, dy = ns[j].y - ns[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 2000 / (dist * dist);
            const fx = (dx / dist) * force, fy = (dy / dist) * force;
            ns[i].vx -= fx; ns[i].vy -= fy; ns[j].vx += fx; ns[j].vy += fy;
          }
        }
        for (const e of es) {
          const s = ns.find((n) => n.id === e.source), t = ns.find((n) => n.id === e.target);
          if (!s || !t) continue;
          const dx = t.x - s.x, dy = t.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const f = dist * 0.001;
          s.vx += (dx / dist) * f; s.vy += (dy / dist) * f; t.vx -= (dx / dist) * f; t.vy -= (dy / dist) * f;
        }
        for (const n of ns) {
          n.vx += (w / 2 - n.x) * 0.0003; n.vy += (h / 2 - n.y) * 0.0003;
          n.vx *= 0.85; n.vy *= 0.85; n.x += n.vx; n.y += n.vy;
          n.x = Math.max(30, Math.min(w - 30, n.x)); n.y = Math.max(30, Math.min(h - 30, n.y));
        }
        ctx.clearRect(0, 0, w, h);
        for (const e of es) {
          const s = ns.find((n) => n.id === e.source), t = ns.find((n) => n.id === e.target);
          if (!s || !t) continue;
          ctx.beginPath(); ctx.moveTo((s.x + offset.x) * zoom, (s.y + offset.y) * zoom); ctx.lineTo((t.x + offset.x) * zoom, (t.y + offset.y) * zoom);
          ctx.strokeStyle = "#c8c4bb"; ctx.lineWidth = 0.5; ctx.stroke();
        }
        for (const n of ns) {
          const nx = (n.x + offset.x) * zoom, ny = (n.y + offset.y) * zoom, nr = n.r * zoom;
          ctx.beginPath(); ctx.arc(nx, ny, nr + 3, 0, Math.PI * 2); ctx.fillStyle = `${dikwColors[n.tier] ?? "#999"}15`; ctx.fill();
          ctx.beginPath(); ctx.arc(nx, ny, nr, 0, Math.PI * 2); ctx.fillStyle = dikwColors[n.tier] ?? "#999"; ctx.fill();
          ctx.beginPath(); ctx.arc(nx, ny, nr, 0, Math.PI * 2); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
          if (nr > 8) { ctx.fillStyle = "#fff"; ctx.font = `bold ${Math.max(7, 8 * zoom)}px Inter`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(n.label, nx, ny); }
        }
        if (selected) {
          const sn = ns.find((n) => n.id === selected.id);
          if (sn) { const sx = (sn.x + offset.x) * zoom, sy = (sn.y + offset.y) * zoom; ctx.beginPath(); ctx.arc(sx, sy, (sn.r + 5) * zoom, 0, Math.PI * 2); ctx.strokeStyle = "#E05C4B"; ctx.lineWidth = 2; ctx.stroke(); }
        }
        frameRef.current = requestAnimationFrame(loop);
      };
      loop();
    }).catch(() => {});

    return () => { cancelled = true; cancelAnimationFrame(frameRef.current); };
  }, [zoom, offset.x, offset.y, selected]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / zoom - offset.x, cy = (e.clientY - rect.top) / zoom - offset.y;
    let closest: Node | null = null, best = Infinity;
    for (const n of nodesRef.current) { const d = Math.sqrt((n.x - cx) ** 2 + (n.y - cy) ** 2); if (d < n.r + 5 && d < best) { closest = n; best = d; } }
    setSelected(closest);
  }, [zoom, offset.x, offset.y]);

  return (
    <div className="relative w-full h-full bg-white">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-grab" onClick={handleClick}
        onMouseDown={() => { setDragging(true); }}
        onMouseMove={(ev) => { if (dragging) setOffset({ x: offset.x + (ev as any).movementX / zoom, y: offset.y + (ev as any).movementY / zoom }); }}
        onMouseUp={() => setDragging(false)} onMouseLeave={() => setDragging(false)} />
      <div className="absolute top-4 left-4 panel-card p-3 shadow-sm z-10">
        <div className="text-[9px] font-bold uppercase tracking-[1.5px] mb-2 font-sans" style={{ color: "var(--muted)" }}>Controls</div>
        <div className="flex items-center gap-2 mb-1"><span className="text-[9px] font-sans" style={{ color: "var(--muted)" }}>Zoom</span><input type="range" min={0.3} max={2} step={0.1} value={zoom} onChange={(ev) => setZoom(parseFloat(ev.target.value))} className="w-16" /><span className="text-[9px] font-sans w-8" style={{ color: "var(--muted)" }}>{Math.round(zoom * 100)}%</span></div>
      </div>
      <div className="absolute bottom-4 left-4 panel-card p-3 shadow-sm z-10">
        <div className="text-[9px] font-bold uppercase tracking-[1.5px] mb-2 font-sans" style={{ color: "var(--muted)" }}>DIKW Levels</div>
        <div className="space-y-1">{Object.entries(dikwColors).map(([tier, color]) => <div key={tier} className="flex items-center gap-2 text-[10px] font-sans"><span className="w-3 h-3 rounded-full" style={{ background: color }} /><span className="capitalize" style={{ color: "var(--ink-light)" }}>{tier}</span></div>)}</div>
      </div>
      {selected && (
        <div className="absolute top-4 right-4 w-[200px] panel-card p-4 shadow-lg z-10">
          <div className="flex items-center justify-between mb-2"><span className="text-[9px] font-bold uppercase tracking-[1.5px] font-sans" style={{ color: "var(--muted)" }}>Node</span><button onClick={() => setSelected(null)} className="text-[var(--muted)] hover:text-[var(--navy)]"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg></button></div>
          <div className="text-[13px] italic font-display mb-1" style={{ color: "var(--navy)" }}>{selected.label}</div>
          <div className="flex items-center gap-2"><span className="dikw-chip text-[8px]" style={{ background: `${dikwColors[selected.tier]}18`, color: dikwColors[selected.tier] }}>{selected.tier}</span><span className="text-[9px] font-sans" style={{ color: "var(--muted)" }}>{selected.type}</span></div>
        </div>
      )}
    </div>
  );
}
