import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Notebook from "./pages/Notebook";
import Lexicon from "./pages/Lexicon";
import Documents from "./pages/Documents";
import Goals from "./pages/Goals";
import Ideas from "./pages/Ideas";
import BulkImport from "./pages/BulkImport";
import Search from "./pages/Search";
import NotebookDetail from "./pages/NotebookDetail";
import LexiconDetail from "./pages/LexiconDetail";
import Export from "./pages/Export";
import Glossary from "./pages/Glossary";
import Projects from "./pages/Projects";
import CalendarPage from "./pages/Calendar";
import SettingsPage from "./pages/Settings";
import Library from "./pages/Library";

function Router() {
  return (
    <Switch>
      <Route path={"/"}>
        {() => (
          <DashboardLayout currentModule="dashboard">
            <Home />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/projects"}>
        {() => (
          <DashboardLayout currentModule="projects">
            <Projects />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/knowledge-base"}>
        {() => (
          <DashboardLayout currentModule="knowledge-base">
            <Search />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/notes"}>
        {() => (
          <DashboardLayout currentModule="notes">
            <Notebook />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/calendar"}>
        {() => (
          <DashboardLayout currentModule="calendar">
            <CalendarPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/settings"}>
        {() => (
          <DashboardLayout currentModule="settings">
            <SettingsPage />
          </DashboardLayout>
        )}
      </Route>

      <Route path={"/notebook"}>
        {() => (
          <DashboardLayout currentModule="notes">
            <Notebook />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/lexicon"}>
        {() => (
          <DashboardLayout currentModule="knowledge-base">
            <Lexicon />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/documents"}>
        {() => (
          <DashboardLayout currentModule="projects">
            <Documents />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/goals"}>
        {() => (
          <DashboardLayout currentModule="projects">
            <Goals />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/ideas"}>
        {() => (
          <DashboardLayout currentModule="knowledge-base">
            <Ideas />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/bulk-import"}>
        {() => (
          <DashboardLayout currentModule="settings">
            <BulkImport />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/search"}>
        {() => (
          <DashboardLayout currentModule="knowledge-base">
            <Search />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/notebook/:id"}>
        {() => (
          <DashboardLayout currentModule="notes">
            <NotebookDetail />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/lexicon/:id"}>
        {() => (
          <DashboardLayout currentModule="knowledge-base">
            <LexiconDetail />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/glossary"}>
        {() => (
          <DashboardLayout currentModule="knowledge-base">
            <Glossary />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/export"}>
        {() => (
          <DashboardLayout currentModule="settings">
            <Export />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/library"}>
        {() => (
          <DashboardLayout currentModule="library">
            <Library />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
