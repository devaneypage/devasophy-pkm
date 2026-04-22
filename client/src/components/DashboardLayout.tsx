import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import {
  BookOpen,
  Download,
  FolderOpen,
  Grid2x2,
  Library,
  LogOut,
  PanelLeft,
  PenSquare,
  Search,
  Settings2,
  Upload,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import TaxonomySidebar from "./TaxonomySidebar";

const menuItems = [
  { icon: Grid2x2, label: "Dashboard", path: "/", accent: "#efb93a" },
  { icon: FolderOpen, label: "Projects", path: "/documents", accent: "#e25b33" },
  { icon: Library, label: "Knowledge Base", path: "/search", accent: "#56c5ea" },
  { icon: BookOpen, label: "Notes", path: "/notebook", accent: "#efb93a" },
  { icon: PenSquare, label: "Clavis Aurea", path: "/lexicon", accent: "#b55af3" },
  { icon: Upload, label: "Import", path: "/bulk-import", accent: "#bfd73d" },
  { icon: Download, label: "Export", path: "/export", accent: "#56c5ea" },
];

const utilityItems = [{ icon: Settings2, label: "Settings", path: "/export", accent: "#e25b33" }];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 292;
const MIN_WIDTH = 240;
const MAX_WIDTH = 420;

type ModuleKey = "home" | "notebook" | "lexicon" | "documents";

export default function DashboardLayout({
  children,
  currentModule,
}: {
  children: React.ReactNode;
  currentModule?: ModuleKey;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background px-6 py-12">
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
          <div className="dev-card w-full p-8 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Devanomy Workspace
            </p>
            <h1 className="mb-4 text-4xl">Sign in to continue</h1>
            <p className="mb-8 text-sm leading-6 text-muted-foreground">
              Access your knowledge hub, lexicon, and research studio from a single integrated workspace.
            </p>
            <Button
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
              size="lg"
              className="h-12 w-full rounded-full border-2 border-black bg-primary text-primary-foreground shadow-none hover:bg-primary/90"
            >
              Enter Devanomy
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent currentModule={currentModule} setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
  currentModule?: ModuleKey;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
  currentModule,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();

  const pathToModule: Record<string, ModuleKey> = {
    "/": "home",
    "/notebook": "notebook",
    "/lexicon": "lexicon",
    "/documents": "documents",
  };

  const activeMenuItem = menuItems.find((item) => item.path === location) ?? menuItems[0];

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="dev-sidebar-panel relative h-28 overflow-hidden border-b border-sidebar-border px-4 py-4">
            <div className="absolute inset-x-0 bottom-0 h-10 dev-sidebar-pattern" />
            <div className="relative z-10 flex items-start justify-between gap-3">
              {!isCollapsed ? (
                <div className="min-w-0">
                  <img
                    src="/manus-storage/logo-wordmark_6ae838d1.png"
                    alt="Devanomy"
                    className="h-16 w-auto max-w-[13rem] object-contain"
                  />
                  <p className="mt-2 text-xs font-medium text-white/80">a personal knowledge taxonomy</p>
                </div>
              ) : (
                <button
                  onClick={toggleSidebar}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white"
                  aria-label="Toggle navigation"
                >
                  <PanelLeft className="h-4 w-4" />
                </button>
              )}

              {!isCollapsed && (
                <button
                  onClick={toggleSidebar}
                  className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Toggle navigation"
                >
                  <PanelLeft className="h-4 w-4" />
                </button>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="dev-sidebar-panel relative gap-0 overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 h-28 dev-sidebar-pattern" />
            <div className="relative z-10 flex h-full flex-col">
              <SidebarMenu className="px-3 py-3">
                {menuItems.map((item) => {
                  const isActive = currentModule
                    ? pathToModule[item.path] === currentModule || location === item.path
                    : location === item.path;

                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setLocation(item.path)}
                        tooltip={item.label}
                        className="h-12 rounded-2xl border border-transparent px-3 text-sidebar-foreground transition-all hover:bg-white/10 data-[active=true]:border-white/15 data-[active=true]:bg-white/10 data-[active=true]:shadow-none"
                      >
                        <span
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 bg-white text-black"
                          style={{ backgroundColor: isActive ? item.accent : "rgba(255,255,255,0.96)" }}
                        >
                          <item.icon className="h-4 w-4" />
                        </span>
                        <span className="font-medium">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>

              {!isCollapsed && (
                <div className="mx-3 mt-2 rounded-[1.35rem] border border-white/12 bg-white/8 backdrop-blur-sm">
                  <TaxonomySidebar />
                </div>
              )}

              <SidebarMenu className="mt-auto px-3 pb-3">
                {utilityItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-12 rounded-2xl border border-transparent px-3 text-sidebar-foreground transition-all hover:bg-white/10"
                    >
                      <span
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 bg-white text-black"
                        style={{ backgroundColor: item.accent }}
                      >
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="font-medium">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>
          </SidebarContent>

          <SidebarFooter className="dev-sidebar-panel border-t border-white/10 p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-2xl border border-white/12 bg-white/8 px-2 py-2 text-left transition hover:bg-white/12 group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50">
                  <Avatar className="h-10 w-10 border-2 border-white/20 bg-[#56c5ea]">
                    <AvatarFallback className="bg-transparent font-semibold text-black">
                      {user?.name?.charAt(0).toUpperCase() || "D"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                    <p className="truncate text-sm font-semibold text-white">{user?.name || "Scholar"}</p>
                    <p className="mt-1 truncate text-xs text-white/70">{user?.email || "Personal workspace"}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dev-card w-52 rounded-2xl border-2 border-black bg-white p-2 shadow-none">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer rounded-xl text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div
          className={`absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-black/20 ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (!isCollapsed) setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-transparent">
        <div className="dev-topbar sticky top-0 z-40">
          <div className="flex h-20 items-center gap-3 px-4 sm:px-6">
            {isMobile && <SidebarTrigger className="h-10 w-10 rounded-2xl border border-black bg-white" />}
            <div className="relative max-w-2xl flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                readOnly
                value={activeMenuItem?.label === "Dashboard" ? "Search your notes, terms, and projects" : `Browse ${activeMenuItem?.label.toLowerCase()}`}
                className="dev-search h-14 pl-12 text-base text-foreground shadow-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-[#56c5ea] text-black">
                <span className="text-lg font-semibold">d</span>
              </div>
              <Avatar className="h-12 w-12 border-2 border-black bg-[#f6f3ec]">
                <AvatarFallback className="bg-transparent font-semibold text-black">
                  {user?.name?.charAt(0).toUpperCase() || "D"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
        <main className="min-h-[calc(100vh-5rem)] flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </SidebarInset>
    </>
  );
}
