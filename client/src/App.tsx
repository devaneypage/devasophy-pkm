import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, type ReactNode } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SynthesisProvider } from "./contexts/SynthesisContext";
import DashboardLayout from "./components/DashboardLayout";
import CommonplaceWorkspaceGate from "./components/CommonplaceWorkspaceGate";
import RouteLoading from "./components/RouteLoading";
import SynthesisTray from "./components/SynthesisTray";

const Home = lazy(() => import("./pages/Home"));
const Notebook = lazy(() => import("./pages/Notebook"));
const Commonplace = lazy(() => import("./pages/Commonplace"));
const Lexicon = lazy(() => import("./pages/Lexicon"));
const Documents = lazy(() => import("./pages/Documents"));
const Goals = lazy(() => import("./pages/Goals"));
const Ideas = lazy(() => import("./pages/Ideas"));
const BulkImport = lazy(() => import("./pages/BulkImport"));
const Search = lazy(() => import("./pages/Search"));
const NotebookDetail = lazy(() => import("./pages/NotebookDetail"));
const LexiconDetail = lazy(() => import("./pages/LexiconDetail"));
const Export = lazy(() => import("./pages/Export"));
const Glossary = lazy(() => import("./pages/Glossary"));
const Deduplication = lazy(() => import("./pages/Deduplication"));
const NotFound = lazy(() => import("./pages/NotFound"));

function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteLoading />}>{children}</Suspense>;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"}>
        {() => (
          <DashboardLayout currentModule="home">
            <LazyRoute><Home /></LazyRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/commonplace"}>
        {() => (
          <DashboardLayout currentModule="notebook">
            <CommonplaceWorkspaceGate>
              <LazyRoute><Commonplace /></LazyRoute>
            </CommonplaceWorkspaceGate>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/library"}>
        {() => (
          <DashboardLayout currentModule="notebook">
            <CommonplaceWorkspaceGate>
              <LazyRoute><Commonplace /></LazyRoute>
            </CommonplaceWorkspaceGate>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/notebook"}>
        {() => (
          <DashboardLayout currentModule="notebook">
            <CommonplaceWorkspaceGate>
              <LazyRoute><Notebook /></LazyRoute>
            </CommonplaceWorkspaceGate>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/lexicon"}>
        {() => (
          <DashboardLayout currentModule="lexicon">
            <LazyRoute><Lexicon /></LazyRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/documents"}>
        {() => (
          <DashboardLayout currentModule="documents">
            <LazyRoute><Documents /></LazyRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/goals"}>
        {() => (
          <DashboardLayout currentModule="goals">
            <LazyRoute><Goals /></LazyRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/ideas"}>
        {() => (
          <DashboardLayout currentModule="ideas">
            <LazyRoute><Ideas /></LazyRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/bulk-import"}>
        {() => (
          <DashboardLayout>
            <LazyRoute><BulkImport /></LazyRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/search"}>
        {() => (
          <DashboardLayout>
            <LazyRoute><Search /></LazyRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/notebook/:id"}>
        {() => (
          <DashboardLayout currentModule="notebook">
            <LazyRoute><NotebookDetail /></LazyRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/lexicon/:id"}>
        {() => (
          <DashboardLayout currentModule="lexicon">
            <LazyRoute><LexiconDetail /></LazyRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/glossary"}>
        {() => (
          <DashboardLayout currentModule="glossary">
            <LazyRoute><Glossary /></LazyRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/export"}>
        {() => (
          <DashboardLayout>
            <LazyRoute><Export /></LazyRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/deduplication"}>
        {() => (
          <DashboardLayout>
            <LazyRoute><Deduplication /></LazyRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/404"}>
        {() => <LazyRoute><NotFound /></LazyRoute>}
      </Route>
      <Route>
        {() => <LazyRoute><NotFound /></LazyRoute>}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <SynthesisProvider>
            <Toaster />
            <Router />
            <SynthesisTray />
          </SynthesisProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
