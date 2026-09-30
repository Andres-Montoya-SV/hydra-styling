import { LanguageSwitcher, useShowcaseText } from "./showcase-i18n";
import {
  lazy,
  Suspense,
  useEffect,
  useState,
  type ComponentType,
  type SVGProps,
} from "react";
const FooterScreen = lazy(() =>
  import("./Screens").then((m) => ({ default: m.FooterScreen })),
);
const MotionScreen = lazy(() =>
  import("./Screens").then((m) => ({ default: m.MotionScreen })),
);
const ProductScreen = lazy(() =>
  import("./Screens").then((m) => ({ default: m.ProductScreen })),
);
import MapDemo, { demoMetrics } from "./MapDemo";
const AccountScreen = lazy(() => import("./AccountScreen"));
const ComponentCatalog = lazy(() => import("./ComponentCatalog"));
import {
  Activity,
  ChevronRight,
  CircleDot,
  FileText,
  Fingerprint,
  Globe2,
  Home,
  KeyRound,
  Layers3,
  Menu,
  Network,
  Play,
  Radar,
  Search,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  MotionProvider,
  NotificationProvider,
  Motion,
  Footer,
  VitralBackground,
  VitralBackdrop,
  RoseWindow,
  ThemeProvider,
  ThemeToggle,
  SiteLoader,
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  HydraMark,
  Input,
  Progress,
  Select,
  Stat,
  Switch,
} from "@hydra-security/ui";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const navItems: Array<{ label: string; icon: Icon }> = [
  { label: "Overview", icon: Home },
  { label: "Recon", icon: Radar },
  { label: "Subdomains", icon: Network },
  { label: "Domains", icon: Globe2 },
  { label: "Infrastructure", icon: Server },
  { label: "Technologies", icon: Layers3 },
  { label: "Vulnerabilities", icon: ShieldAlert },
  { label: "Reports", icon: FileText },
];

const findings = [
  {
    title: "Exposed admin panel",
    target: "/admin",
    severity: "high" as const,
    icon: TriangleAlert,
  },
  {
    title: "Open SSH port",
    target: "22/tcp",
    severity: "high" as const,
    icon: Server,
  },
  {
    title: "Outdated TLS version",
    target: "TLS 1.0",
    severity: "medium" as const,
    icon: KeyRound,
  },
  {
    title: "Subdomain takeover",
    target: "dev.example.com",
    severity: "medium" as const,
    icon: Network,
  },
];

function VitralHero() {
  const t = useShowcaseText();
  return (
    <section className="vitral-hero" aria-label={t("Hydra overview")}>
      <VitralBackdrop />
      <RoseWindow className="vitral-hero-window" />
      <div className="vitral-hero-copy">
        <p className="vitral-eyebrow">{t("HYDRA / EXTERNAL ATTACK SURFACE")}</p>
        <h1>
          {t("Clarity beyond")}
          <br />
          <span>{t("the horizon.")}</span>
        </h1>
        <p className="vitral-hero-description">
          {t("Bring your unknown assets into the light.")}
        </p>
        <div className="vitral-hero-status">
          <span aria-hidden="true" />
          <span>{t("Scan complete")}</span>
          <span className="vitral-hero-divider">/</span>
          <span>example.com · 2m 34s</span>
        </div>
      </div>
      <span className="vitral-hero-caption" aria-hidden="true">
        VITRAL 01 / NOCTURNE → DAYLIGHT
      </span>
    </section>
  );
}

function Sidebar({
  open,
  close,
  view,
  navigate,
}: {
  open: boolean;
  close: () => void;
  view: string;
  navigate: (view: string) => void;
}) {
  const t = useShowcaseText();
  return (
    <aside
      id="hydra-navigation"
      className={`hydra-sidebar fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-hydra-line bg-hydra-canvas/98 p-4 backdrop-blur transition-transform lg:static lg:translate-x-0 ${open ? "visible translate-x-0" : "invisible -translate-x-full lg:visible"}`}
    >
      <div className="mb-8 flex items-center justify-between">
        <HydraMark wordmark className="w-44" />
        <button
          className="text-hydra-muted lg:hidden"
          onClick={close}
          aria-label={t("Close menu")}
        >
          <X />
        </button>
      </div>
      <p className="sidebar-label">{t("Workspace")}</p>
      <nav aria-label={t("Primary")} className="grid gap-1">
        {navItems.map(({ label, icon: NavIcon }) => (
          <button
            key={label}
            onClick={() => {
              navigate(label === "Overview" ? "dashboard" : label);
              close();
            }}
            aria-current={
              view === (label === "Overview" ? "dashboard" : label)
                ? "page"
                : undefined
            }
            className={`flex items-center gap-3 rounded-hydra-sm px-3 py-2.5 text-left text-sm font-semibold transition ${view === (label === "Overview" ? "dashboard" : label) ? "sidebar-active" : "text-hydra-muted hover:bg-hydra-surface hover:text-hydra-text"}`}
          >
            <NavIcon className="size-4" aria-hidden="true" />
            {t(label)}
          </button>
        ))}
      </nav>
      <button
        onClick={() => {
          navigate("Inventory");
          close();
        }}
        aria-current={view === "Inventory" ? "page" : undefined}
        className="rounded-hydra px-3 py-2 text-left text-sm text-hydra-accent-ink"
      >
        {t("Asset inventory")}
      </button>
      <button
        onClick={() => {
          navigate("Hydra runs");
          close();
        }}
        aria-current={view === "Hydra runs" ? "page" : undefined}
        className="rounded-hydra px-3 py-2 text-left text-sm text-hydra-accent-ink"
      >
        {t("Hydra runs")}
      </button>
      <button
        onClick={() => {
          navigate("App toolkit");
          close();
        }}
        aria-current={view === "App toolkit" ? "page" : undefined}
        className="rounded-hydra px-3 py-2 text-left text-sm text-hydra-accent-ink"
      >
        {t("App toolkit")}
      </button>
      <nav aria-label={t("Design system")} className="my-5 grid gap-2">
        {["components", "motion", "footers", "account"].map((item) => (
          <button
            key={item}
            onClick={() => {
              navigate(item);
              close();
            }}
            aria-current={view === item ? "page" : undefined}
            className={`rounded-hydra px-3 py-2 text-left text-sm capitalize ${view === item ? "bg-hydra-surface-strong text-hydra-accent-ink" : "text-hydra-muted"}`}
          >
            {t(item)}
          </button>
        ))}
      </nav>
      <div className="mt-auto rounded-hydra border border-hydra-line bg-hydra-surface p-4">
        <ShieldCheck className="mb-3 size-6 text-hydra-accent" />
        <p className="font-display text-lg font-bold">
          {t("A wider perspective.")}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-hydra-muted">
          {t("Continuous visibility for every external asset.")}
        </p>
      </div>
      <button
        onClick={() => {
          navigate("Settings");
          close();
        }}
        className="mt-3 flex items-center gap-3 px-3 py-2 text-sm text-hydra-muted"
      >
        <Settings className="size-4" />
        {t("Settings")}
      </button>
    </aside>
  );
}

function Dashboard({ navigate }: { navigate: (view: string) => void }) {
  const t = useShowcaseText();
  return (
    <div className="dashboard-layout space-y-5 p-4 md:p-7">
      <div className="dashboard-heading">
        <div>
          <p className="vitral-eyebrow">{t("YOUR SECURITY POSTURE")}</p>
          <h2>{t("Surface overview")}</h2>
        </div>
        <Badge>{t("Demonstration data")}</Badge>
      </div>
      <VitralHero />
      <section
        aria-label={t("Scan metrics")}
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Stat
          label={t("Subdomains")}
          value={demoMetrics.subdomains}
          delta="12%"
          trend="up"
          icon={<Network className="size-5" />}
        />
        <Stat
          label={t("Live hosts")}
          value={demoMetrics.hosts}
          delta="8%"
          trend="up"
          icon={<Server className="size-5" />}
          className="[--hs-accent:var(--hs-info)]"
        />
        <Stat
          label={t("Open ports")}
          value={demoMetrics.ports}
          delta="15%"
          trend="up"
          icon={<CircleDot className="size-5" />}
          className="[--hs-accent:var(--hs-success)]"
        />
        <Stat
          label={t("Vulnerabilities")}
          value={demoMetrics.findings}
          delta="6%"
          trend="down"
          icon={<ShieldAlert className="size-5" />}
          className="[--hs-accent:var(--hs-danger)]"
        />
      </section>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.85fr)_minmax(260px,1fr)]">
        <div className="min-w-0">
          <MapDemo />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-hydra-orange" />
              {t("Requires attention")}
            </CardTitle>
            <button
              className="text-xs text-hydra-accent-ink"
              onClick={() => navigate("Vulnerabilities")}
            >
              {t("View all →")}
            </button>
          </CardHeader>
          <CardContent className="divide-y divide-hydra-line p-0">
            {findings.map(({ title, target, severity, icon: FindingIcon }) => (
              <div key={title} className="flex items-center gap-3 px-5 py-3.5">
                <span className="grid size-9 place-items-center rounded-full bg-hydra-surface-strong text-hydra-orange">
                  <FindingIcon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {t(title)}
                  </span>
                  <span className="text-xs text-hydra-muted">{target}</span>
                </span>
                <Badge severity={severity}>{t(severity)}</Badge>
              </div>
            ))}
          </CardContent>
          <div className="finding-summary">
            <ShieldCheck size={18} />
            <div>
              <strong>{t("Every finding, in context.")}</strong>
              <p>
                {t("Select a point on the map to trace its relationships.")}
              </p>
            </div>
          </div>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TerminalSquare className="size-4 text-hydra-success" />
              {t("Live output")}
            </CardTitle>
            <Badge severity="info">{t("Sample output")}</Badge>
          </CardHeader>
          <CardContent className="font-mono text-xs leading-6 text-hydra-muted">
            <p>
              <span className="text-hydra-success">[INFO]</span> Starting Hydra
              scan on example.com
            </p>
            <p>
              <span className="text-hydra-success">[INFO]</span> Found{" "}
              {demoMetrics.subdomains} subdomains
            </p>
            <p>
              <span className="text-hydra-success">[INFO]</span> Resolving
              hosts... {demoMetrics.hosts} live
            </p>
            <p>
              <span className="text-hydra-warning">[WARN]</span>{" "}
              {demoMetrics.findings} actionable findings detected
            </p>
            <p>
              <span className="text-hydra-accent-ink">[DONE]</span> Surface
              mapped in 2m 34s
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("Scan progress")}</CardTitle>
            <Activity className="size-4 text-hydra-success" />
          </CardHeader>
          <CardContent className="grid gap-5">
            <Progress value={100} label={t("Discovery")} />
            <Progress value={100} label={t("Analysis")} />
            <Progress value={100} label={t("Validation")} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function App() {
  const t = useShowcaseText();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [view, setView] = useState("dashboard");
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const menu = document.getElementById("hydra-navigation");
    menu?.querySelector<HTMLButtonElement>("button")?.focus();
    const handle = (event: KeyboardEvent) => {
      if (window.innerWidth >= 1024) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
      }
      if (event.key === "Tab") {
        const items = Array.from(
          menu?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ??
            [],
        ).filter((el) => el.getClientRects().length);
        const first = items[0],
          last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, [mobileOpen]);
  const [animated, setAnimated] = useState(true);
  useEffect(() => {
    const sync = () => {
      let hash = "";
      try {
        hash = decodeURIComponent(window.location.hash.slice(1)).split("/")[0];
      } catch {
        /* Treat malformed fragments as the overview. */
      }
      const known = [
        "account",
        "App toolkit",
        "Hydra runs",
        "Inventory",
        "dashboard",
        "components",
        "motion",
        "footers",
        "Settings",
        ...navItems.map((n) => n.label),
      ];
      setView(
        known.find((n) => n.toLowerCase() === hash.toLowerCase()) ??
          "dashboard",
      );
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  function navigate(next: string) {
    window.location.hash = next;
    setView(next);
  }

  return (
    <MotionProvider enabled={animated}>
      <ThemeProvider storageKey="hydra:theme">
        <NotificationProvider>
          <div className="hydra-ocean-shell flex min-h-screen text-hydra-text">
            <VitralBackground />
            <Sidebar
              open={mobileOpen}
              close={() => setMobileOpen(false)}
              view={view}
              navigate={navigate}
            />
            {mobileOpen && (
              <button
                aria-label={t("Close navigation")}
                className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                onClick={() => setMobileOpen(false)}
              />
            )}
            <div className="min-w-0 flex-1">
              <header className="sticky top-0 z-20 flex h-18 items-center gap-3 border-b border-hydra-line bg-hydra-canvas/90 px-4 backdrop-blur md:px-6">
                <button
                  className="text-hydra-muted lg:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-label={t("Open menu")}
                  aria-expanded={mobileOpen}
                  aria-controls="hydra-navigation"
                >
                  <Menu />
                </button>
                <span className="mr-auto font-display text-lg sm:hidden">
                  Hydra Security
                </span>
                <div className="hidden rounded-hydra-sm border border-hydra-line bg-hydra-surface p-1 sm:flex">
                  <button
                    onClick={() => navigate("dashboard")}
                    className={`rounded px-3 py-1.5 text-xs font-bold ${view === "dashboard" ? "bg-hydra-accent text-hydra-on-accent" : "text-hydra-muted"}`}
                  >
                    {t("Product")}
                  </button>
                  <button
                    onClick={() => navigate("components")}
                    className={`rounded px-3 py-1.5 text-xs font-bold ${view === "components" ? "bg-hydra-accent text-hydra-on-accent" : "text-hydra-muted"}`}
                  >
                    {t("Components")}
                  </button>
                </div>
                <div className="mx-auto hidden max-w-xl flex-1 md:block">
                  <Input
                    aria-label={t("Scan target")}
                    leading={<Sparkles className="size-4" />}
                    placeholder={t("Target domain, IP, CIDR, or file…")}
                  />
                </div>
                <Button
                  className="hidden sm:inline-flex"
                  onClick={() => navigate("Recon")}
                >
                  <Play className="size-4 fill-current" />
                  {t("Scan")}
                </Button>
                <ThemeToggle />

                <div className="hidden items-center gap-2 xl:flex">
                  <span className="grid size-8 place-items-center rounded-full bg-hydra-surface-strong text-hydra-accent-ink">
                    <Fingerprint className="size-4" />
                  </span>
                  <span className="text-xs font-semibold">Hydra Security</span>
                  <ChevronRight className="size-3 text-hydra-muted" />
                </div>
              </header>
              <div className="showcase-location flex flex-wrap items-center justify-between gap-4 border-b border-hydra-line px-6 py-3">
                <span className="text-xs text-hydra-muted capitalize">
                  Hydra <span className="px-2 opacity-50">/</span>{" "}
                  {t(view === "dashboard" ? "Overview" : view)}
                </span>
                <LanguageSwitcher />
                <Switch
                  label={t("Animations")}
                  checked={animated}
                  onChange={(e) => setAnimated(e.target.checked)}
                />
              </div>
              <main>
                <Suspense fallback={<SiteLoader label={t("Loading view…")} />}>
                  <Motion key={view}>
                    {view === "dashboard" ? (
                      <Dashboard navigate={navigate} />
                    ) : view === "components" ? (
                      <ComponentCatalog />
                    ) : (
                      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
                        <h1 className="font-display text-3xl capitalize">
                          {t(view)}
                        </h1>
                        {view === "account" ? (
                          <AccountScreen />
                        ) : view === "footers" ? (
                          <FooterScreen />
                        ) : view === "motion" ? (
                          <MotionScreen />
                        ) : (
                          <ProductScreen key={view} screen={view} />
                        )}
                      </div>
                    )}
                  </Motion>
                </Suspense>
              </main>
              <div className="p-4 md:p-6">
                <Footer variant="simple" />
              </div>
            </div>
          </div>
        </NotificationProvider>
      </ThemeProvider>
    </MotionProvider>
  );
}
