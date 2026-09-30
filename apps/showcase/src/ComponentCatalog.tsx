import { useShowcaseText } from "./showcase-i18n";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  Badge,
  Button,
  CodeMockup,
  Input,
  Link,
  RoseWindow,
  VitralBackdrop,
  DensityProvider,
  LocaleProvider,
  useHydraLocale,
  Field,
  Select,
  type HydraDensity,
} from "@hydra-security/ui";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import ComponentPreview from "./ComponentPreview";
import HydraExtras from "./HydraExtras";
import FoundationsPreview from "./FoundationsPreview";
import DataControlsPreview from "./DataControlsPreview";
const ConsistencyPreview = lazy(() => import("./ConsistencyPreview"));
const FeedbackPreview = lazy(() => import("./FeedbackPreview"));
const ApiReference = lazy(() => import("./ApiReference"));
import {
  catalog,
  categories,
  type CatalogEntry,
  type CatalogCategory,
} from "./component-catalog";

function CatalogCard({
  entry,
  detail = false,
}: {
  entry: CatalogEntry;
  detail?: boolean;
}) {
  const t = useShowcaseText();
  const { locale: siteLocale } = useHydraLocale();
  const [density, setDensity] = useState<HydraDensity>("comfortable"),
    [locale, setLocale] = useState("");
  return (
    <article
      className={`catalog-card${detail ? " catalog-card-detail" : ""}`}
      data-component={entry.id}
      aria-labelledby={`catalog-title-${entry.id}`}
    >
      <header>
        <div>
          <p className="catalog-card-category">{t(entry.category)}</p>
          <h2 id={`catalog-title-${entry.id}`}>
            <a href={`#components/${entry.id}`}>{entry.name}</a>
          </h2>
        </div>
        <code>{entry.api}</code>
      </header>
      <p className="catalog-card-description">{t(entry.description)}</p>
      {detail && (
        <div className="catalog-detail-settings">
          <Field label={t("Component density")}>
            <Select
              value={density}
              onChange={(e) => setDensity(e.target.value as HydraDensity)}
            >
              <option value="comfortable">{t("Comfortable")}</option>
              <option value="compact">{t("Compact")}</option>
            </Select>
          </Field>
          <Field label={t("Component language")}>
            <Select value={locale} onChange={(e) => setLocale(e.target.value)}>
              <option value="">{t("Use site language")}</option>
              <option value="en-US">English</option>
              <option value="es-SV">Español</option>
              <option value="pt-BR">Português (Brasil)</option>
            </Select>
          </Field>
        </div>
      )}
      <div className="catalog-card-preview">
        <LocaleProvider locale={locale || siteLocale} className="contents">
          <DensityProvider density={density} className="contents">
            <ComponentPreview id={entry.id} />
          </DensityProvider>
        </LocaleProvider>
      </div>
      <details className="catalog-code" open={detail || undefined}>
        <summary>
          {t("Usage example")}
          <span aria-hidden="true">⌘</span>
        </summary>
        <div>
          <CodeMockup language="tsx" caption={entry.api} code={entry.code} />
          <p>
            {t("Import from")}
            <code>@hydra-security/ui</code>
            {t(". Supply your application data and callbacks.")}
          </p>
          <Link href={entry.source} target="_blank" rel="noreferrer">
            {t("daisyUI reference ↗")}
          </Link>
        </div>
      </details>
      {detail && (
        <Suspense fallback={<p role="status">{t("Loading API reference…")}</p>}>
          <ApiReference exports={entry.api} />
        </Suspense>
      )}
    </article>
  );
}
export default function ComponentCatalog() {
  const t = useShowcaseText();
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState<CatalogCategory | "All">("All"),
    [selected, setSelected] = useState("");
  useEffect(() => {
    const sync = () => {
      const slug = window.location.hash.slice(1).split("/")[1] ?? "";
      setSelected(slug);
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const entry = catalog.find((item) => item.id === selected),
    index = entry ? catalog.indexOf(entry) : -1;
  const filtered = catalog.filter(
    (item) =>
      (category === "All" || item.category === category) &&
      `${item.name} ${item.api} ${item.description} ${t(item.description)} ${t(item.category)}`
        .toLowerCase()
        .includes(search.toLowerCase().trim()),
  );
  function showAll() {
    setSelected("");
    setSearch("");
    setCategory("All");
    window.location.hash = "components";
  }
  return (
    <div className="component-catalog">
      <section className="catalog-intro">
        <VitralBackdrop />
        <div className="catalog-intro-copy">
          <Badge severity="info">{t("VITRAL / COMPONENT LIBRARY")}</Badge>
          <h1>{t("Glass, made functional.")}</h1>
          <p>
            {t("One visual language. Every building block.")}
            <br />
            {t(
              "Explore {count} interactive components, from a single input to an entire workspace.",
              { count: catalog.length },
            )}
          </p>
          <div className="catalog-intro-meta">
            <span>{t("{count} COMPONENTS", { count: catalog.length })}</span>
            <span>{t("7 CATEGORIES")}</span>
            <span>{t("2 THEMES")}</span>
          </div>
        </div>
        <RoseWindow className="catalog-intro-window" />
      </section>
      <Link className="catalog-foundations-link" href="#components/foundations">
        {t("Explore application foundations →")}
      </Link>
      <Link
        className="catalog-foundations-link"
        href="#components/data-controls"
      >
        {t("Explore data controls →")}
      </Link>
      <Link className="catalog-foundations-link" href="#components/consistency">
        {t("Explore states and language →")}
      </Link>
      <Link className="catalog-foundations-link" href="#components/feedback">
        {t("Explore alerts and notifications →")}
      </Link>
      {selected === "feedback" ? (
        <Suspense fallback={<p role="status">{t("Loading state preview…")}</p>}>
          <FeedbackPreview />
        </Suspense>
      ) : selected === "consistency" ? (
        <Suspense fallback={<p role="status">{t("Loading state preview…")}</p>}>
          <ConsistencyPreview />
        </Suspense>
      ) : selected === "data-controls" ? (
        <DataControlsPreview />
      ) : selected === "foundations" ? (
        <FoundationsPreview />
      ) : entry ? (
        <>
          <nav
            className="catalog-detail-nav"
            aria-label={t("Component navigation")}
          >
            <Button variant="ghost" onClick={showAll}>
              <ArrowLeft size={16} />
              {t("All components")}
            </Button>
            <div>
              {index > 0 && (
                <Link
                  href={`#components/${catalog[index - 1].id}`}
                  aria-label={t("Previous component: {name}", {
                    name: catalog[index - 1].name,
                  })}
                >
                  {t("← Previous")}
                </Link>
              )}
              {index < catalog.length - 1 && (
                <Link
                  href={`#components/${catalog[index + 1].id}`}
                  aria-label={t("Next component: {name}", {
                    name: catalog[index + 1].name,
                  })}
                >
                  {t("Next")}
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </nav>
          <CatalogCard key={entry.id} entry={entry} detail />
        </>
      ) : (
        <>
          <div className="catalog-tools">
            <label className="catalog-search">
              <span className="sr-only">{t("Search components")}</span>
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Search components…")}
                aria-label={t("Search components")}
                leading={<Search size={16} />}
              />
            </label>
            <span className="catalog-result-count" role="status">
              {t("{shown} of {count} components", {
                shown: filtered.length,
                count: catalog.length,
              })}
            </span>
          </div>
          <nav
            className="catalog-categories"
            aria-label={t("Component categories")}
          >
            {(["All", ...categories] as const).map((item) => (
              <Button
                key={item}
                variant={category === item ? "primary" : "ghost"}
                size="sm"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {t(item)}
                <span>
                  {item === "All"
                    ? catalog.length
                    : catalog.filter((entry) => entry.category === item).length}
                </span>
              </Button>
            ))}
          </nav>
          {selected && !entry && (
            <p role="status" className="catalog-empty">
              {t("That component could not be found. Choose one below.")}
            </p>
          )}
          <div className="catalog-grid">
            {filtered.map((entry) => (
              <CatalogCard key={entry.id} entry={entry} />
            ))}
          </div>
          {!filtered.length && (
            <div className="catalog-empty">
              <h2>{t("No matching components")}</h2>
              <p>{t("Try another name or reset the filters.")}</p>
              <Button variant="outline" onClick={showAll}>
                {t("Reset filters")}
              </Button>
            </div>
          )}
        </>
      )}
      {!entry &&
        !["foundations", "data-controls", "consistency", "feedback"].includes(
          selected,
        ) &&
        !search &&
        category === "All" && <HydraExtras />}
      <footer className="catalog-footnote">
        {t(
          "Component coverage based on the daisyUI catalog · Original Hydra implementations and Vitral styling.",
        )}
        <br />
        {t(
          "Previews use demonstration data. Interactive controls do not run scans or send requests.",
        )}
      </footer>
    </div>
  );
}
