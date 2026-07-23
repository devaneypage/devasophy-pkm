import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--cream)" }}>
      {/* Brand Panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12" style={{ background: "linear-gradient(135deg, #1B2A4A 0%, #2A3F6B 100%)" }}>
        <div>
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#E05C4B" }}>
              <span className="text-white text-xs font-bold">D</span>
            </div>
            <span className="font-display text-lg font-semibold text-white">Devasophy</span>
          </div>
          <h1 className="font-display text-4xl font-semibold text-white mb-4 leading-tight">
            A philosopher's<br />atelier
          </h1>
          <p className="text-sm leading-relaxed max-w-sm" style={{ color: "#8AA4C8" }}>
            Devasophy PKM evolved from Devanomy — a systemic knowledge architecture for thinkers, writers, and researchers who believe ideas deserve durable structure.
          </p>
        </div>
        <div className="text-[10px]" style={{ color: "#5A7A9A" }}>
          <div className="font-medium mb-1" style={{ color: "#8AA4C8" }}>Daily Intention</div>
          <p>Synthesize the relationship between local structures and conceptual ontologies.</p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#E05C4B" }}>
              <span className="text-white text-xs font-bold">D</span>
            </div>
            <span className="font-display text-lg font-semibold" style={{ color: "var(--navy)" }}>Devasophy</span>
          </div>

          <h2 className="font-display text-2xl font-semibold mb-1" style={{ color: "var(--navy)" }}>
            {isRegister ? "Create account" : "Welcome back"}
          </h2>
          <p className="text-[11px] mb-6 font-sans" style={{ color: "var(--ink-muted)" }}>
            {isRegister ? "Join the atelier" : "Sign in to your knowledge territory"}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-[11px] font-sans" style={{ background: "#F5E0DD", color: "#E05C4B" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-wider mb-1 font-sans" style={{ color: "var(--ink-light)" }}>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border text-[12px] font-sans focus:outline-none focus:ring-2 focus:ring-[#E05C4B]/20 focus:border-[#E05C4B] transition-all"
                  style={{ borderColor: "var(--line)", background: "white" }}
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider mb-1 font-sans" style={{ color: "var(--ink-light)" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border text-[12px] font-sans focus:outline-none focus:ring-2 focus:ring-[#E05C4B]/20 focus:border-[#E05C4B] transition-all"
                style={{ borderColor: "var(--line)", background: "white" }}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider mb-1 font-sans" style={{ color: "var(--ink-light)" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border text-[12px] font-sans focus:outline-none focus:ring-2 focus:ring-[#E05C4B]/20 focus:border-[#E05C4B] transition-all"
                style={{ borderColor: "var(--line)", background: "white" }}
                placeholder="6+ characters"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg text-white text-[12px] font-medium font-sans transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "#E05C4B" }}
            >
              {loading ? "..." : isRegister ? "Create account" : "Sign in"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(""); }}
              className="text-[11px] font-sans font-medium hover:underline transition-all"
              style={{ color: "var(--coral)" }}
            >
              {isRegister ? "Already have an account? Sign in" : "Need an account? Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
