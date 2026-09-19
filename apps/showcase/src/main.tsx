import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import {MotionProvider,SiteLoader} from '@hydra-security/ui';
const App=lazy(()=>import('./App'));
import "./app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><MotionProvider><Suspense fallback={<SiteLoader/>}><App /></Suspense></MotionProvider></StrictMode>,
);
