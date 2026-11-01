import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import ElementDetail from './pages/ElementDetail';
import AllElements from './pages/AllElements';
import Compare from './pages/Compare';
import Practice from './pages/Practice';
import SavedProgress from './pages/SavedProgress';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

// Standalone /study/ deployments, production builds, and packaged shells use HashRouter
// so deep links (#/element/iron, #/compare?ids=...) work under any directory without server rewrites.
// The Base44 editor preview iframe in dev mode continues to support direct path navigation.
const useHashRouting =
  import.meta.env.VITE_ROUTER !== 'browser' &&
  (import.meta.env.PROD ||
    import.meta.env.VITE_PACKAGED === 'true' ||
    import.meta.env.VITE_STANDALONE === 'true' ||
    (typeof window !== 'undefined' &&
      (window.location.pathname.startsWith('/study') ||
        window.location.hash.startsWith('#/') ||
        window.self === window.top)));

const Router = useHashRouting ? HashRouter : BrowserRouter;

const AuthenticatedApp = () => {

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/elements" element={<AllElements />} />
      <Route path="/element/:slug" element={<ElementDetail />} />
      <Route path="/compare" element={<Compare />} />
      <Route path="/practice" element={<Practice />} />
      <Route path="/saved" element={<SavedProgress />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
  )
}

export default App