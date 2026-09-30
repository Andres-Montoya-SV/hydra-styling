import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  CodeMockup,
  Input,
  Link,
  RoseWindow,
  VitralBackdrop,
} from "@hydra-security/ui";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import ComponentPreview from "./ComponentPreview";
import HydraExtras from "./HydraExtras";
import FoundationsPreview from "./FoundationsPreview";
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
  return (
    <article
      className={`catalog-card${detail ? " catalog-card-detail" : ""}`}
      data-component={entry.id}
      aria-labelledby={`catalog-title-${entry.id}`}
    >
      <header>
        <div>
          <p className="catalog-card-category">{entry.category}</p>
          <h2 id={`catalog-title-${entry.id}`}>
            <a href={`#components/${entry.id}`}>{entry.name}</a>
          </h2>
        </div>
        <code>{entry.api}</code>
      </header>
      <p className="catalog-card-description">{entry.description}</p>
      <div className="catalog-card-preview">
        <ComponentPreview id={entry.id} />
      </div>
      <details className="catalog-code" open={detail || undefined}>
        <summary>
          Usage example <span aria-hidden="true">⌘</span>
        </summary>
        <div>
          <CodeMockup language="tsx" caption={entry.api} code={entry.code} />
          <p>
            Import from <code>@hydra-security/ui</code>. Supply your application
            data and callbacks.
          </p>
          <Link href={entry.source} target="_blank" rel="noreferrer">
            daisyUI reference ↗
          </Link>
        </div>
      </details>
    </article>
  );
}
export default function ComponentCatalog() {
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
      `${item.name} ${item.api} ${item.description}`
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
          <Badge severity="info">VITRAL / COMPONENT LIBRARY</Badge>
          <h1>Glass, made functional.</h1>
          <p>
            One visual language. Every building block.
            <br />
            Explore {catalog.length} interactive components, from a single input
            to an entire workspace.
          </p>
          <div className="catalog-intro-meta">
            <span>{catalog.length} COMPONENTS</span>
            <span>7 CATEGORIES</span>
            <span>2 THEMES</span>
          </div>
        </div>
        <RoseWindow className="catalog-intro-window" />
      </section>
      <Link className="catalog-foundations-link" href="#components/foundations">Explore application foundations →</Link>
      {selected === "foundations" ? <FoundationsPreview /> : entry ? (
        <>
          <nav className="catalog-detail-nav" aria-label="Component navigation">
            <Button variant="ghost" onClick={showAll}>
              <ArrowLeft size={16} />
              All components
            </Button>
            <div>
              {index > 0 && (
                <Link
                  href={`#components/${catalog[index - 1].id}`}
                  aria-label={`Previous component: ${catalog[index - 1].name}`}
                >
                  ← Previous
                </Link>
              )}
              {index < catalog.length - 1 && (
                <Link
                  href={`#components/${catalog[index + 1].id}`}
                  aria-label={`Next component: ${catalog[index + 1].name}`}
                >
                  Next <ArrowRight size={14} />
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
              <span className="sr-only">Search components</span>
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search components…"
                aria-label="Search components"
                leading={<Search size={16} />}
              />
            </label>
            <span className="catalog-result-count" role="status">
              {filtered.length} of {catalog.length} components
            </span>
          </div>
          <nav className="catalog-categories" aria-label="Component categories">
            {(["All", ...categories] as const).map((item) => (
              <Button
                key={item}
                variant={category === item ? "primary" : "ghost"}
                size="sm"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
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
              That component could not be found. Choose one below.
            </p>
          )}
          <div className="catalog-grid">
            {filtered.map((entry) => (
              <CatalogCard key={entry.id} entry={entry} />
            ))}
          </div>
          {!filtered.length && (
            <div className="catalog-empty">
              <h2>No matching components</h2>
              <p>Try another name or reset the filters.</p>
              <Button variant="outline" onClick={showAll}>
                Reset filters
              </Button>
            </div>
          )}
        </>
      )}
      {!entry && selected !== "foundations" && !search && category === "All" && <HydraExtras />}
      <footer className="catalog-footnote">
        Component coverage based on the daisyUI catalog · Original Hydra
        implementations and Vitral styling.
        <br />
        Previews use demonstration data. Interactive controls do not run scans
        or send requests.
      </footer>
    </div>
  );
}
