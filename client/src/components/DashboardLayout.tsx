import { useEffect } from "react";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { useAuth } from "@/../src/_core/hooks/useAuth";
import {
  Bell,
  BookOpen,
  Home,
  Library,
  LogOut,
  Network,
  PanelLeft,
  PenLine,
  Search,
  Settings2,
  ArrowRight,
} from "lucide-react";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

// JD categories for splash sidebar and sidebar widget
const JD_CATEGORIES = [
  { num: "10", label: "LANGUAGE" },
  { num: "20", label: "LITERATURE" },
  { num: "30", label: "QUOTATIONS", active: true },
  { num: "40", label: "RESEARCH" },
  { num: "50", label: "CONCEPTS" },
  { num: "60", label: "METHODS" },
  { num: "90", label: "SYSTEM" },
];

// Sidebar navigation items
const NAV_ITEMS = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: Library, label: "Library", path: "/library" },
  { icon: BookOpen, label: "Notes", path: "/notes" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: PenLine, label: "Writing", path: "/documents" },
  { icon: Settings2, label: "Settings", path: "/settings" },
];

// Bottom tab navigation (mobile-first)
const BOTTOM_TABS = [
  { icon: Home, label: "HOME", path: "/" },
  { icon: Library, label: "LIBRARY", path: "/library" },
  { icon: Network, label: "GRAPH", path: "/knowledge-base" },
  { icon: PenLine, label: "CREATE", path: "/notes" },
  { icon: Settings2, label: "OS", path: "/settings" },
];

export type ModuleKey = "dashboard" | "projects" | "knowledge-base" | "notes" | "calendar" | "settings" | "library";

export default function DashboardLayout({
  children,
  currentModule,
}: {
  children: React.ReactNode;
  currentModule?: ModuleKey;
}) {
  const { loading, user } = useAuth();

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return <SplashScreen />;
  }

  return (
    <SidebarProvider>
      <DashboardLayoutContent currentModule={currentModule}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

// ─── Splash / Sign-in Screen ────────────────────────────────────────────────
function SplashScreen() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      {/* Left JD sidebar */}
      <aside className="hidden md:flex w-44 flex-shrink-0 flex-col border-r border-black/8 bg-[#FAFAFA] py-8 pl-6">
        <p className="mb-6 text-[0.6rem] font-bold uppercase tracking-[0.3em] text-black/30">Index</p>
        {JD_CATEGORIES.map((cat) => (
          <div key={cat.num} className={`mb-4 flex items-baseline gap-2 ${cat.active ? "text-[#E84D20]" : "text-black/30"}`}>
            <span className="text-xs font-bold tabular-nums">{cat.num}</span>
            <span className={`text-xs font-semibold uppercase tracking-[0.12em] ${cat.active ? "text-[#E84D20]" : ""}`}>{cat.label}</span>
            {cat.active && <span className="ml-auto mr-4 h-1.5 w-1.5 rounded-full bg-[#E84D20]" />}
          </div>
        ))}
        <div className="mt-auto">
          <p className="text-[0.55rem] font-medium uppercase tracking-[0.2em] text-black/20 leading-relaxed">No system is final.<br />All axioms are revision.</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-start justify-center px-8 md:px-16 py-12">
        {/* Wordmark */}
        <div className="mb-8">
          <div className="flex items-center gap-1.5">
            <span className="text-3xl font-black tracking-[-0.04em] text-black lowercase">devanomy</span>
            <span className="h-2.5 w-2.5 rounded-full bg-[#F16A43]" />
          </div>
          <p className="mt-0.5 text-[0.6rem] font-bold uppercase tracking-[0.28em] text-black/30">Ember Red Dot</p>
        </div>

        {/* Tagline */}
        <h1
          className="mb-4 max-w-xs text-4xl font-black leading-[1.05] tracking-tight text-black md:text-5xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          The laws, order, and architecture of your mind.
        </h1>
        <p className="mb-10 max-w-xs text-[0.7rem] font-bold uppercase tracking-[0.2em] text-black/40">
          A personal knowledge system built for a life of intent.
        </p>

        {/* Spider-web decorative element */}
        <div className="mb-10 flex h-24 w-24 items-center justify-center opacity-20">
          <svg viewBox="0 0 100 100" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="0.8">
            {[0, 30, 60, 90, 120, 150].map((angle) => (
              <line
                key={angle}
                x1="50"
                y1="50"
                x2={50 + 45 * Math.cos((angle * Math.PI) / 180)}
                y2={50 + 45 * Math.sin((angle * Math.PI) / 180)}
                className="text-black"
              />
            ))}
            {[10, 20, 30, 40].map((r) => (
              <circle key={r} cx="50" cy="50" r={r} className="text-black" />
            ))}
            <circle cx="50" cy="50" r="4" fill="#F16A43" stroke="none" />
          </svg>
        </div>

        {/* Buttons */}
        <div className="flex w-full max-w-xs flex-col gap-3">
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="flex h-12 items-center justify-between rounded-full bg-[#E84D20] px-6 text-sm font-bold uppercase tracking-[0.15em] text-white hover:bg-[#d43b10]"
          >
            Enter Devanomy
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            variant="outline"
            className="h-12 rounded-full border-black/20 bg-transparent text-sm font-bold uppercase tracking-[0.15em] text-black hover:bg-black/4"
          >
            Continue Last Session
          </Button>
        </div>
      </main>
    </div>
  );
}

// ─── Main Authenticated Layout ───────────────────────────────────────────────
function DashboardLayoutContent({
  children,
  currentModule,
}: {
  children: React.ReactNode;
  currentModule?: ModuleKey;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();

  const routeModuleMap: Record<string, ModuleKey> = {
    "/": "dashboard",
    "/projects": "projects",
    "/knowledge-base": "knowledge-base",
    "/notes": "notes",
    "/calendar": "calendar",
    "/settings": "settings",
    "/documents": "projects",
    "/goals": "projects",
    "/search": "knowledge-base",
    "/lexicon": "knowledge-base",
    "/ideas": "knowledge-base",
    "/glossary": "knowledge-base",
    "/notebook": "notes",
    "/bulk-import": "settings",
    "/export": "settings",
    "/library": "library",
  };

  const resolvedModule = currentModule ?? routeModuleMap[location] ?? "dashboard";

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-black/8 bg-white">
        <SidebarHeader className="border-b border-black/8 px-4 py-4">
          <div className="flex items-center justify-between">
            {!isCollapsed ? (
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-[-0.04em] text-black lowercase">devanomy</span>
                <span className="h-2 w-2 rounded-full bg-[#F16A43]" />
              </div>
            ) : (
              <span className="h-2 w-2 rounded-full bg-[#F16A43]" />
            )}
            <button
              onClick={toggleSidebar}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-black/50 hover:bg-black/5"
            >
              <PanelLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        </SidebarHeader>

        <SidebarContent className="bg-white">
          <SidebarMenu className="px-2 py-2">
            {NAV_ITEMS.map((item) => {
              const isActive = item.path === "/"
                ? resolvedModule === "dashboard"
                : location.startsWith(item.path);
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => setLocation(item.path)}
                    tooltip={item.label}
                    className={`h-10 rounded-xl px-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#E84D20]/8 text-[#E84D20]"
                        : "text-black/60 hover:bg-black/4 hover:text-black"
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? "text-[#E84D20]" : ""}`} />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>

          {!isCollapsed && (
            <div className="mx-3 mt-2 rounded-xl border border-black/6 bg-[#FAFAFA] p-3">
              <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-[0.22em] text-black/30">JD Index</p>
              {JD_CATEGORIES.map((cat) => (
                <button
                  key={cat.num}
                  onClick={() => setLocation("/knowledge-base")}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
                    cat.active ? "text-[#E84D20]" : "text-black/40 hover:text-black/70"
                  }`}
                >
                  <span className="text-[0.65rem] font-bold tabular-nums">{cat.num}</span>
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.1em]">{cat.label}</span>
                </button>
              ))}
            </div>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t border-black/8 bg-white p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-xl border border-black/8 px-2 py-2 text-left hover:bg-black/4 focus:outline-none">
                <Avatar className="h-8 w-8 border border-black/10 bg-[#E84D20]/10">
                  <AvatarFallback className="bg-transparent text-xs font-bold text-[#E84D20]">
                    {user?.name?.charAt(0).toUpperCase() || "D"}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-black">{user?.name || "Scholar"}</p>
                    <p className="truncate text-[0.6rem] text-black/40">{user?.email || "Personal workspace"}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border border-black/10 bg-white p-1 shadow-lg">
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer rounded-lg text-sm text-red-500 focus:bg-red-50 focus:text-red-500"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-white">
        {/* Top Header */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-black/8 bg-white px-4">
          {isMobile && (
            <SidebarTrigger className="h-9 w-9 rounded-xl border border-black/10" />
          )}
          <div className="flex items-center gap-2 flex-1">
            <span className="text-lg font-black tracking-[-0.04em] text-black lowercase">devanomy</span>
            <span className="h-2 w-2 rounded-full bg-[#F16A43]" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocation("/search")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10"
            >
              <Search className="h-4 w-4 text-black/60" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10">
              <Bell className="h-4 w-4 text-black/60" />
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)] flex-1 bg-white pb-20">
          {children}
        </main>

        {/* Bottom Tab Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center border-t border-black/8 bg-white">
          {BOTTOM_TABS.map((tab) => {
            const isActive = tab.path === "/" ? location === "/" : location.startsWith(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => setLocation(tab.path)}
                className="flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors"
              >
                <tab.icon
                  className={`h-5 w-5 transition-colors ${isActive ? "text-[#E84D20]" : "text-black/30"}`}
                />
                <span
                  className={`text-[0.55rem] font-bold uppercase tracking-[0.1em] transition-colors ${
                    isActive ? "text-[#E84D20]" : "text-black/30"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </SidebarInset>
    </>
  );
}
