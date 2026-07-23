import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import LayoutShell from "@/components/LayoutShell";
import LoginPage from "@/pages/LoginPage";
import Dashboard from "@/pages/Dashboard";
import LibraryPage from "@/pages/LibraryPage";
import CommonplacePage from "@/pages/CommonplacePage";
import QuotationsPage from "@/pages/QuotationsPage";
import VocabularyPage from "@/pages/VocabularyPage";
import BooksPage from "@/pages/BooksPage";
import ResearchPage from "@/pages/ResearchPage";
import IdeasPage from "@/pages/IdeasPage";
import PlansPage from "@/pages/PlansPage";
import SynthesisPage from "@/pages/SynthesisPage";
import AtlasPage from "@/pages/AtlasPage";
import ExportsPage from "@/pages/ExportsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
        <div className="text-center">
          <div className="font-display text-xl font-semibold mb-2" style={{ color: "var(--navy)" }}>Devasophy</div>
          <div className="text-[11px] font-sans" style={{ color: "var(--ink-muted)" }}>Loading your atelier...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <LayoutShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/atlas" element={<AtlasPage />} />
        <Route path="/commonplace" element={<CommonplacePage />} />
        <Route path="/notes" element={<CommonplacePage />} />
        <Route path="/quotations" element={<QuotationsPage />} />
        <Route path="/glossary" element={<VocabularyPage />} />
        <Route path="/vocabulary" element={<VocabularyPage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/research" element={<ResearchPage />} />
        <Route path="/ideas" element={<IdeasPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/synthesis" element={<SynthesisPage />} />
        <Route path="/exports" element={<ExportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </LayoutShell>
  );
}

export default function App() {
  return <AppRoutes />;
}
