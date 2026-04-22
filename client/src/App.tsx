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
import BulkImport from "./pages/BulkImport";
import Search from "./pages/Search";
import NotebookDetail from "./pages/NotebookDetail";
import LexiconDetail from "./pages/LexiconDetail";
import Export from "./pages/Export";

function Router() {
  return (
    <Switch>
      <Route path={"/"}>
        {() => (
          <DashboardLayout currentModule="home">
            <Home />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/notebook"}>
        {() => (
          <DashboardLayout currentModule="notebook">
            <Notebook />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/lexicon"}>
        {() => (
          <DashboardLayout currentModule="lexicon">
            <Lexicon />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/documents"}>
        {() => (
          <DashboardLayout currentModule="documents">
            <Documents />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/bulk-import"}>
        {() => (
          <DashboardLayout>
            <BulkImport />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/search"}>
        {() => (
          <DashboardLayout>
            <Search />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/notebook/:id"}>
        {() => (
          <DashboardLayout currentModule="notebook">
            <NotebookDetail />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/lexicon/:id"}>
        {() => (
          <DashboardLayout currentModule="lexicon">
            <LexiconDetail />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/export"}>
        {() => (
          <DashboardLayout>
            <Export />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
