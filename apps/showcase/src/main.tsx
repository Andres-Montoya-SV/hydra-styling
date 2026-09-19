import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import {ErrorBoundary,MotionProvider,SiteLoader} from '@hydra-security/ui';
const App=lazy(()=>import('./App'));
import "./app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><MotionProvider><ErrorBoundary><Suspense fallback={<SiteLoader/>}><App /></Suspense></ErrorBoundary></MotionProvider></StrictMode>,
);
