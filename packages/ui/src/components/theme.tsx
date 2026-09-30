import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Button } from "./button";

export type HydraTheme = "nocturne" | "daylight";
export type HydraThemeInput = HydraTheme | "parchment" | "dark" | "light";
export function resolveHydraTheme(value: unknown): HydraTheme | null {
  if (value === "daylight" || value === "parchment" || value === "light")
    return "daylight";
  if (value === "nocturne" || value === "dark") return "nocturne";
  return null;
}
const ThemeContext = createContext<{
  theme: HydraTheme;
  setTheme: (theme: HydraThemeInput) => void;
} | null>(null);

/** Scoped and SSR-safe. Persistence is optional; storage failure never blocks a switch. */
export function ThemeProvider({
  children,
  defaultTheme = "nocturne",
  storageKey,
}: {
  children: ReactNode;
  defaultTheme?: HydraThemeInput;
  storageKey?: string;
}) {
  const [theme, update] = useState<HydraTheme>(
    () => resolveHydraTheme(defaultTheme) ?? "nocturne",
  );
  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = resolveHydraTheme(localStorage.getItem(storageKey));
      if (stored) update(stored);
    } catch {
      /* Private or restricted storage: session-only theme. */
    }
    const sync = (event: StorageEvent) => {
      if (event.key === storageKey) {
        const next = resolveHydraTheme(event.newValue);
        if (next) update(next);
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [storageKey]);
  function setTheme(next: HydraThemeInput) {
    const resolved = resolveHydraTheme(next);
    if (!resolved) return;
    update(resolved);
    if (storageKey)
      try {
        localStorage.setItem(storageKey, resolved);
      } catch {
        /* Retain the in-memory choice. */
      }
  }
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className="hydra-theme" data-hydra-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useHydraTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useHydraTheme requires ThemeProvider.");
  return context;
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useHydraTheme();
  const dark = theme === "nocturne";
  return (
    <Button
      variant="outline"
      className={className}
      aria-label={`Use ${dark ? "light" : "dark"} theme`}
      onClick={() => setTheme(dark ? "daylight" : "nocturne")}
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 1v3m0 16v3M1 12h3m16 0h3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
          </>
        ) : (
          <path d="M20.5 14.2A8.7 8.7 0 0 1 9.8 3.5a8.7 8.7 0 1 0 10.7 10.7Z" />
        )}
      </svg>
      <span className="hydra-theme-toggle-label">
        {dark ? "Let light in" : "After dark"}
      </span>
    </Button>
  );
}
