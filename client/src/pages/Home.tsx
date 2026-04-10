import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Scroll, PenTool, Plus } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const modules = [
    {
      id: "notebook",
      title: "Commonplace Notebook",
      description: "Capture quotes, passages, and observations with full source metadata",
      icon: BookOpen,
      color: "from-amber-600 to-amber-700",
      href: "/notebook",
    },
    {
      id: "lexicon",
      title: "Clavis Aurea",
      description: "Personal lexicon and concordance with alphabetical indexing",
      icon: Scroll,
      color: "from-amber-700 to-amber-800",
      href: "/lexicon",
    },
    {
      id: "documents",
      title: "Research & Writing Studio",
      description: "Markdown editor with linked references and document organization",
      icon: PenTool,
      color: "from-amber-500 to-amber-600",
      href: "/documents",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-accent/20 border-b border-border px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold mb-2 text-foreground">Welcome to Devasophy</h1>
          <p className="text-lg text-muted-foreground">
            A scholarly personal knowledge management system for capturing, organizing, and connecting your intellectual work.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Card className="bg-card/50 border-border p-6">
            <div className="text-3xl font-bold text-primary mb-2">0</div>
            <div className="text-sm text-muted-foreground">Notebook Entries</div>
          </Card>
          <Card className="bg-card/50 border-border p-6">
            <div className="text-3xl font-bold text-accent mb-2">0</div>
            <div className="text-sm text-muted-foreground">Lexicon Terms</div>
          </Card>
          <Card className="bg-card/50 border-border p-6">
            <div className="text-3xl font-bold text-primary mb-2">0</div>
            <div className="text-sm text-muted-foreground">Documents</div>
          </Card>
        </div>

        {/* Module Cards */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Explore Your Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Card
                  key={module.id}
                  className="bg-card border-border hover:border-primary transition-all cursor-pointer group"
                  onClick={() => setLocation(module.href)}
                >
                  <div className={`bg-gradient-to-br ${module.color} h-24 flex items-center justify-center mb-4`}>
                    <Icon size={40} className="text-white opacity-80" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-foreground">{module.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(module.href);
                      }}
                    >
                      Open Module
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              className="flex items-center gap-2"
              onClick={() => setLocation("/notebook")}
            >
              <Plus size={20} />
              New Notebook Entry
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setLocation("/lexicon")}
            >
              <Plus size={20} />
              Add Vocabulary Term
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setLocation("/documents")}
            >
              <Plus size={20} />
              Start New Document
            </Button>
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-12 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              <strong className="text-foreground">Commonplace Notebook:</strong> Capture quotes, passages, and observations from your reading and research with full source attribution.
            </p>
            <p>
              <strong className="text-foreground">Clavis Aurea (Personal Lexicon):</strong> Build your personal glossary with definitions, etymologies, and usage notes. Search and filter by part of speech, source type, or date added.
            </p>
            <p>
              <strong className="text-foreground">Research & Writing Studio:</strong> Write and edit documents in Markdown with inline access to your lexicon terms and notebook entries.
            </p>
            <p>
              <strong className="text-foreground">Cross-Module Linking:</strong> Create bi-directional links between entries across all three modules to build a connected knowledge base.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
