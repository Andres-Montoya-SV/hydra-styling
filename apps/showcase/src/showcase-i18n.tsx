import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LocaleProvider, Select, useHydraLocale } from "@hydra-security/ui";
import { showcaseTranslations } from "./showcase-translations";

export type ShowcaseLocale = "en-US" | "es-SV" | "pt-BR";
const LocaleSelection = createContext<{
  locale: ShowcaseLocale;
  setLocale: (locale: ShowcaseLocale) => void;
}>({ locale: "en-US", setLocale: () => {} });
function validLocale(value: unknown): value is ShowcaseLocale {
  return value === "en-US" || value === "es-SV" || value === "pt-BR";
}
export function ShowcaseLanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [locale, update] = useState<ShowcaseLocale>("en-US");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("hydra:locale");
      if (validLocale(saved)) update(saved);
    } catch {
      /* Session-only language when storage is unavailable. */
    }
    const sync = (event: StorageEvent) => {
      if (event.key === "hydra:locale" && validLocale(event.newValue))
        update(event.newValue);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = locale;
    return () => {
      document.documentElement.lang = previous;
    };
  }, [locale]);
  function setLocale(value: ShowcaseLocale) {
    if (!validLocale(value)) return;
    update(value);
    try {
      localStorage.setItem("hydra:locale", value);
    } catch {
      /* Keep the in-memory preference. */
    }
  }
  return (
    <LocaleSelection.Provider value={{ locale, setLocale }}>
      <LocaleProvider locale={locale} className="contents">
        {children}
      </LocaleProvider>
    </LocaleSelection.Provider>
  );
}

/** Explicit static copy only. Unknown application data and code are returned unchanged. */
export function showcaseText(locale: string) {
  const index = locale.startsWith("es") ? 0 : locale.startsWith("pt") ? 1 : -1;
  return (source: string, values: Record<string, string | number> = {}) => {
    const translation =
      showcaseTranslations[source as keyof typeof showcaseTranslations];
    const text =
      translation && index === 0
        ? translation[0]
        : translation && index === 1
          ? translation[1]
          : source;
    return text.replace(/\{(\w+)\}/g, (token, key: string) =>
      values[key] === undefined ? token : String(values[key]),
    );
  };
}
export function useShowcaseText() {
  const { locale } = useHydraLocale();
  return useMemo(() => showcaseText(locale), [locale]);
}
export function LanguageSwitcher() {
  const { locale, setLocale } = useContext(LocaleSelection);
  const t = useShowcaseText();
  return (
    <label className="showcase-language">
      <span>{t("Language")}</span>
      <Select
        aria-label={t("Site language")}
        controlSize="sm"
        value={locale}
        onChange={(event) => setLocale(event.target.value as ShowcaseLocale)}
      >
        <option value="en-US" lang="en">
          English
        </option>
        <option value="es-SV" lang="es">
          Español
        </option>
        <option value="pt-BR" lang="pt-BR">
          Português (Brasil)
        </option>
      </Select>
    </label>
  );
}
