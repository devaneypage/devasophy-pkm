import { useNavigate } from "react-router";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="font-display text-4xl font-semibold mb-2" style={{ color: "var(--navy)" }}>404</h1>
      <p className="text-[12px] font-sans mb-4" style={{ color: "var(--ink-muted)" }}>This page does not exist in your knowledge territory.</p>
      <button onClick={() => navigate("/dashboard")} className="btn-primary text-[11px]">Return to Dashboard</button>
    </div>
  );
}
