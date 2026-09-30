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
import {
  Activity,
  ChevronRight,
  CircleDot,
  FileDown,
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
  HydraIcon,
  PasswordInput,
  RangeInput,
  FileInput,
  RadioGroup,
  MotionProvider,
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
  Checkbox,
  DocumentCard,
  Field,
  HydraMark,
  Input,
  Progress,
  Select,
  Stat,
  Switch,
  Textarea,
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
  return (
    <section className="vitral-hero" aria-label="Hydra overview">
      <VitralBackdrop />
      <RoseWindow className="vitral-hero-window" />
      <div className="vitral-hero-copy">
        <p className="vitral-eyebrow">HYDRA / EXTERNAL ATTACK SURFACE</p>
        <h1>
          Clarity beyond
          <br />
          <span>the horizon.</span>
        </h1>
        <p className="vitral-hero-description">
          Bring your unknown assets into the light.
        </p>
        <div className="vitral-hero-status">
          <span aria-hidden="true" />
          <span>Scan complete</span>
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
          aria-label="Close menu"
        >
          <X />
        </button>
      </div>
      <p className="sidebar-label">Workspace</p>
      <nav aria-label="Primary" className="grid gap-1">
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
            {label}
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
        Asset inventory
      </button>
      <button
        onClick={() => {
          navigate("Hydra runs");
          close();
        }}
        aria-current={view === "Hydra runs" ? "page" : undefined}
        className="rounded-hydra px-3 py-2 text-left text-sm text-hydra-accent-ink"
      >
        Hydra runs
      </button>
      <button
        onClick={() => {
          navigate("App toolkit");
          close();
        }}
        aria-current={view === "App toolkit" ? "page" : undefined}
        className="rounded-hydra px-3 py-2 text-left text-sm text-hydra-accent-ink"
      >
        App toolkit
      </button>
      <nav aria-label="Design system" className="my-5 grid gap-2">
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
            {item}
          </button>
        ))}
      </nav>
      <div className="mt-auto rounded-hydra border border-hydra-line bg-hydra-surface p-4">
        <ShieldCheck className="mb-3 size-6 text-hydra-accent" />
        <p className="font-display text-lg font-bold">A wider perspective.</p>
        <p className="mt-1 text-xs leading-relaxed text-hydra-muted">
          Continuous visibility for every external asset.
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
        Settings
      </button>
    </aside>
  );
}

function Dashboard({ navigate }: { navigate: (view: string) => void }) {
  return (
    <div className="dashboard-layout space-y-5 p-4 md:p-7">
      <div className="dashboard-heading">
        <div>
          <p className="vitral-eyebrow">YOUR SECURITY POSTURE</p>
          <h2>Surface overview</h2>
        </div>
        <Badge>Demonstration data</Badge>
      </div>
      <VitralHero />
      <section
        aria-label="Scan metrics"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Stat
          label="Subdomains"
          value={demoMetrics.subdomains}
          delta="12%"
          trend="up"
          icon={<Network className="size-5" />}
        />
        <Stat
          label="Live hosts"
          value={demoMetrics.hosts}
          delta="8%"
          trend="up"
          icon={<Server className="size-5" />}
          className="[--hs-accent:var(--hs-info)]"
        />
        <Stat
          label="Open ports"
          value={demoMetrics.ports}
          delta="15%"
          trend="up"
          icon={<CircleDot className="size-5" />}
          className="[--hs-accent:var(--hs-success)]"
        />
        <Stat
          label="Vulnerabilities"
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
              Requires attention
            </CardTitle>
            <button
              className="text-xs text-hydra-accent-ink"
              onClick={() => navigate("Vulnerabilities")}
            >
              View all →
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
                    {title}
                  </span>
                  <span className="text-xs text-hydra-muted">{target}</span>
                </span>
                <Badge severity={severity}>{severity}</Badge>
              </div>
            ))}
          </CardContent>
          <div className="finding-summary">
            <ShieldCheck size={18} />
            <div>
              <strong>Every finding, in context.</strong>
              <p>Select a point on the map to trace its relationships.</p>
            </div>
          </div>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TerminalSquare className="size-4 text-hydra-success" />
              Live output
            </CardTitle>
            <Badge severity="info">Sample output</Badge>
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
            <CardTitle>Scan progress</CardTitle>
            <Activity className="size-4 text-hydra-success" />
          </CardHeader>
          <CardContent className="grid gap-5">
            <Progress value={100} label="Discovery" />
            <Progress value={100} label="Analysis" />
            <Progress value={100} label="Validation" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ComponentLab() {
  const [profile, setProfile] = useState("passive");
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div>
        <Badge severity="info">VITRAL / COMPONENT LIBRARY</Badge>
        <h1 className="mt-3 font-display text-4xl font-bold">
          Glass, made functional.
        </h1>
        <p className="mt-2 max-w-2xl text-hydra-muted">
          Faceted controls, quiet surfaces and light with a purpose. One visual
          language, from a single input to your entire workspace.
        </p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Scan target" hint="Domain, IP, CIDR, or asset file">
              <Input
                leading={<Search className="size-4" />}
                placeholder="example.com"
              />
            </Field>
            <Field label="Profile">
              <Select defaultValue="full">
                <option value="full">Full reconnaissance</option>
                <option value="passive">Passive discovery</option>
              </Select>
            </Field>
            <Field label="Notes" optional>
              <Textarea placeholder="Context for the security team…" />
            </Field>
            <Field
              label="Validation state"
              error="Enter a domain without a protocol."
            >
              <Input defaultValue="https://example.com" />
            </Field>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button>
              <Play className="size-4" />
              Run scan
            </Button>
            <Button variant="secondary">Enumerate</Button>
            <Button variant="outline">Compare</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="danger">Delete</Button>
            <Button disabled>Pending review</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <Checkbox
              label="Validate findings"
              description="Reduce false positives with safe verification."
              defaultChecked
            />
            <Switch
              label="Continuous monitoring"
              description="Watch the external attack surface."
              defaultChecked
            />
            <Alert
              tone="warning"
              icon={<TriangleAlert className="size-5" />}
              title="Potential disruption"
            >
              Active checks may trigger defensive controls.
            </Alert>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Severity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge severity="critical">Critical</Badge>
            <Badge severity="high">High</Badge>
            <Badge severity="medium">Medium</Badge>
            <Badge severity="low">Low</Badge>
            <Badge severity="info">Info</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>System iconography</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-5">
            {(
              [
                "01-general-ui/search",
                "01-general-ui/menu",
                "01-general-ui/close",
                "03-recon-network/subdomain",
                "02-states-severity/vulnerable",
                "05-technologies/react",
              ] as const
            ).map((name) => (
              <div key={name} className="grid justify-items-center gap-2">
                <HydraIcon name={name} className="size-12" />
                <span className="text-xs">{name.split("/")[1]}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Documents & evidence</CardTitle>
            <Button variant="outline" size="sm">
              <FileDown className="size-4" />
              Export all
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <DocumentCard
              name="executive-surface-report.pdf"
              kind="pdf"
              meta="2.4 MB · just now"
            />
            <DocumentCard
              name="asset-inventory.csv"
              kind="csv"
              meta="342 rows"
            />
            <DocumentCard name="scan-evidence.json" kind="json" meta="Signed" />
            <DocumentCard
              name="screenshots.zip"
              kind="archive"
              meta="18 files"
            />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Advanced controls</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="API credential">
              <PasswordInput autoComplete="off" />
            </Field>
            <RangeInput label="Concurrency" min={1} max={20} defaultValue={4} />
            <FileInput
              label="Import asset inventory"
              accept=".csv,.json"
              multiple
            />
            <RadioGroup
              label="Scan mode"
              name="scan-mode"
              options={[
                { value: "passive", label: "Passive" },
                { value: "active", label: "Active" },
              ]}
              value={profile}
              onChange={setProfile}
            />
            {(
              [
                "date",
                "time",
                "datetime-local",
                "number",
                "color",
                "email",
                "url",
                "search",
                "tel",
              ] as const
            ).map((type) => (
              <Field key={type} label={type}>
                <Input type={type} />
              </Field>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function App() {
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
      const hash = decodeURIComponent(window.location.hash.slice(1));
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
              aria-label="Close navigation"
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
          )}
          <div className="min-w-0 flex-1">
            <header className="sticky top-0 z-20 flex h-18 items-center gap-3 border-b border-hydra-line bg-hydra-canvas/90 px-4 backdrop-blur md:px-6">
              <button
                className="text-hydra-muted lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
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
                  Product
                </button>
                <button
                  onClick={() => navigate("components")}
                  className={`rounded px-3 py-1.5 text-xs font-bold ${view === "components" ? "bg-hydra-accent text-hydra-on-accent" : "text-hydra-muted"}`}
                >
                  Components
                </button>
              </div>
              <div className="mx-auto hidden max-w-xl flex-1 md:block">
                <Input
                  aria-label="Scan target"
                  leading={<Sparkles className="size-4" />}
                  placeholder="Target domain, IP, CIDR, or file…"
                />
              </div>
              <Button
                className="hidden sm:inline-flex"
                onClick={() => navigate("Recon")}
              >
                <Play className="size-4 fill-current" />
                Scan
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
            <div className="showcase-location flex items-center justify-between gap-4 border-b border-hydra-line px-6 py-3">
              <span className="text-xs text-hydra-muted capitalize">
                Hydra <span className="px-2 opacity-50">/</span>{" "}
                {view === "dashboard" ? "Overview" : view}
              </span>
              <Switch
                label="Animations"
                checked={animated}
                onChange={(e) => setAnimated(e.target.checked)}
              />
            </div>
            <main>
              <Suspense fallback={<SiteLoader label="Loading view…" />}>
                <Motion key={view}>
                  {view === "dashboard" ? (
                    <Dashboard navigate={navigate} />
                  ) : view === "components" ? (
                    <ComponentLab />
                  ) : (
                    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
                      <h1 className="font-display text-3xl capitalize">
                        {view}
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
      </ThemeProvider>
    </MotionProvider>
  );
}
