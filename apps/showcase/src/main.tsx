import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary, MotionProvider, SiteLoader } from "@hydra-security/ui";
const App = lazy(() => import("./App"));
import "./app.css";
import { ShowcaseLanguageProvider } from "./showcase-i18n";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ShowcaseLanguageProvider>
      <MotionProvider>
        <ErrorBoundary>
          <Suspense fallback={<SiteLoader />}>
            <App />
          </Suspense>
        </ErrorBoundary>
      </MotionProvider>
    </ShowcaseLanguageProvider>
  </StrictMode>,
);
