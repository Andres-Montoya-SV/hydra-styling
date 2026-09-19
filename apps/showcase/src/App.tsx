import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import {FooterScreen,MotionScreen,ProductScreen} from './Screens';
import MapDemo from './MapDemo';
import {
  Activity, Bell, Boxes, Bug, Check, ChevronRight, CircleDot, Copy, FileDown,
  FileText, Fingerprint, Globe2, Hexagon, Home, KeyRound, Layers3, Menu, Moon,
  Network, Play, Radar, RefreshCw, Search, Server, Settings, ShieldAlert, ShieldCheck,
  Sparkles, Sun, TerminalSquare, TreePine, TriangleAlert, X,
} from "lucide-react";
import {
  HydraIcon, PasswordInput, RangeInput, FileInput, RadioGroup, AssetRelations,
  MotionProvider, Motion, Footer,
  Alert, Badge, Button, Card, CardContent, CardHeader, CardTitle, Checkbox,
  DocumentCard, Field, FolkSun, HydraMark, Input, Progress, Select, Stat, Switch, Textarea,
} from "@hydra-security/ui";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const navItems: Array<{ label: string; icon: Icon }> = [
  { label: "Overview", icon: Home }, { label: "Recon", icon: Radar },
  { label: "Subdomains", icon: Network }, { label: "Domains", icon: Globe2 },
  { label: "Infrastructure", icon: Server }, { label: "Technologies", icon: Layers3 },
  { label: "Vulnerabilities", icon: ShieldAlert }, { label: "Reports", icon: FileText },
];

const findings = [
  { title: "Exposed admin panel", target: "/admin", severity: "high" as const, icon: TriangleAlert },
  { title: "Open SSH port", target: "22/tcp", severity: "high" as const, icon: Server },
  { title: "Outdated TLS version", target: "TLS 1.0", severity: "medium" as const, icon: KeyRound },
  { title: "Subdomain takeover", target: "dev.example.com", severity: "medium" as const, icon: Network },
];

function FolkLandscape() {
  return (
    <div className="folk-banner relative min-h-36 overflow-hidden rounded-hydra-lg border border-hydra-accent/40 p-6 text-hydra-ink">
      <div className="absolute inset-x-0 bottom-0 h-20 bg-[#24715d] folk-mountain opacity-90" />
      <div className="absolute -bottom-7 right-[8%] size-28 rounded-full bg-[#e35f24]" />
      <div className="absolute bottom-2 right-[30%] h-14 w-20 bg-[#f2d39e] [clip-path:polygon(0_35%,50%_0,100%_35%,100%_100%,0_100%)]">
        <span className="absolute bottom-0 left-8 h-7 w-4 bg-[#0b4d4d]" />
      </div>
      <div className="relative z-10 max-w-xl">
        <div className="mb-2 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-[#167b5a] text-white"><Check className="size-5" /></span>
          <p className="font-display text-3xl font-bold italic">Scan complete</p>
        </div>
        <p className="ml-13 font-semibold">example.com</p>
        <p className="ml-13 mt-1 text-xs font-medium">Completed in 2m 34s · 12,487 assets discovered</p>
      </div>
    </div>
  );
}

function Sidebar({ open, close, view, navigate }: { open: boolean; close: () => void; view:string; navigate:(view:string)=>void }) {
  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-hydra-line bg-hydra-canvas/98 p-4 backdrop-blur transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="mb-8 flex items-center justify-between">
        <HydraMark wordmark className="w-44" />
        <button className="text-hydra-muted lg:hidden" onClick={close} aria-label="Close menu"><X /></button>
      </div>
      <nav aria-label="Primary" className="grid gap-1">
        {navItems.map(({ label, icon: NavIcon }, index) => (
          <button key={label} onClick={()=>{navigate(label==='Overview'?'dashboard':label);close();}} aria-current={view===(label==='Overview'?'dashboard':label)?'page':undefined} className={`flex items-center gap-3 rounded-hydra-sm px-3 py-2.5 text-left text-sm font-semibold transition ${view === (label==='Overview'?'dashboard':label) ? "bg-hydra-accent text-hydra-on-accent" : "text-hydra-muted hover:bg-hydra-surface hover:text-hydra-text"}`}>
            <HydraIcon name={(['01-general-ui/home','06-tools-actions/scan','03-recon-network/subdomain','03-recon-network/http','03-recon-network/service','06-tools-actions/modules','02-states-severity/vulnerable','09-files-documents/file'] as const)[index]} className="size-6"/>{label}
          </button>
        ))}
      </nav>
      <button onClick={()=>{navigate('Inventory');close();}} aria-current={view==='Inventory'?'page':undefined} className="rounded-hydra px-3 py-2 text-left text-sm text-hydra-accent">Asset inventory</button>
      <nav aria-label="Design system" className="my-5 grid gap-2">{['components','motion','footers'].map(item=><button key={item} onClick={()=>{navigate(item);close();}} aria-current={view===item?'page':undefined} className={`rounded-hydra px-3 py-2 text-left text-sm capitalize ${view===item?'bg-hydra-surface-strong text-hydra-accent':'text-hydra-muted'}`}>{item}</button>)}</nav>
      <div className="mt-auto rounded-hydra border border-hydra-line bg-hydra-surface p-4">
        <TreePine className="mb-3 size-8 text-hydra-success" />
        <p className="font-display text-lg font-bold">Know your territory.</p>
        <p className="mt-1 text-xs leading-relaxed text-hydra-muted">Continuous visibility for every external asset.</p>
      </div>
      <button onClick={()=>{navigate('Settings');close();}} className="mt-3 flex items-center gap-3 px-3 py-2 text-sm text-hydra-muted"><Settings className="size-4" />Settings</button>
    </aside>
  );
}

function Dashboard() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <FolkLandscape />
      <section aria-label="Scan metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Subdomains" value="342" delta="12%" trend="up" icon={<Network className="size-5" />} />
        <Stat label="Live hosts" value="128" delta="8%" trend="up" icon={<Server className="size-5" />} className="[--hs-accent:var(--hs-orange)]" />
        <Stat label="Open ports" value="1,024" delta="15%" trend="up" icon={<CircleDot className="size-5" />} className="[--hs-accent:var(--hs-success)]" />
        <Stat label="Vulnerabilities" value="7" delta="6%" trend="down" icon={<ShieldAlert className="size-5" />} className="[--hs-accent:var(--hs-danger)]" />
      </section>
      <div className="grid gap-4 2xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardContent className="p-0"><MapDemo /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="size-4 text-hydra-orange" />Top findings</CardTitle><button className="text-xs text-hydra-muted">View all →</button></CardHeader>
          <CardContent className="divide-y divide-hydra-line p-0">
            {findings.map(({ title, target, severity, icon: FindingIcon }) => (
              <div key={title} className="flex items-center gap-3 px-5 py-3.5">
                <span className="grid size-9 place-items-center rounded-full bg-hydra-surface-strong text-hydra-orange"><FindingIcon className="size-4" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{title}</span><span className="text-xs text-hydra-muted">{target}</span></span>
                <Badge severity={severity}>{severity}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TerminalSquare className="size-4 text-hydra-success" />Live output</CardTitle><Button variant="ghost" size="sm"><Copy className="size-3" />Copy</Button></CardHeader>
          <CardContent className="font-mono text-xs leading-6 text-hydra-muted">
            <p><span className="text-hydra-success">[INFO]</span> Starting Hydra scan on example.com</p>
            <p><span className="text-hydra-success">[INFO]</span> Found 342 subdomains</p>
            <p><span className="text-hydra-success">[INFO]</span> Resolving hosts... 128 live</p>
            <p><span className="text-hydra-warning">[WARN]</span> 7 actionable findings detected</p>
            <p><span className="text-hydra-accent">[DONE]</span> Surface mapped in 2m 34s</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Scan progress</CardTitle><Activity className="size-4 text-hydra-success" /></CardHeader>
          <CardContent className="grid gap-5">
            <Progress value={100} label="Discovery" /><Progress value={84} label="Analysis" /><Progress value={61} label="Validation" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ComponentLab() {
  const [profile,setProfile]=useState('passive');
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div><Badge severity="info">Design system 0.1</Badge><h1 className="mt-3 font-display text-4xl font-bold">Hydra foundations</h1><p className="mt-2 max-w-2xl text-hydra-muted">Security interfaces with a Salvadoran visual accent—clear under pressure, recognizable without becoming decorative noise.</p></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Advanced controls</CardTitle></CardHeader><CardContent className="grid gap-4"><Field label="API credential"><PasswordInput autoComplete="off" /></Field><RangeInput label="Concurrency" min={1} max={20} defaultValue={4}/><FileInput label="Import asset inventory" accept=".csv,.json" multiple/><RadioGroup label="Scan mode" name="scan-mode" options={[{value:'passive',label:'Passive'},{value:'active',label:'Active'}]} value={profile} onChange={setProfile}/>{(['date','time','datetime-local','number','color','email','url','search','tel'] as const).map(type=><Field key={type} label={type}><Input type={type}/></Field>)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Hydra icon vocabulary</CardTitle></CardHeader><CardContent className="grid grid-cols-3 gap-5">{(['01-general-ui/search','01-general-ui/menu','01-general-ui/close','08-graphics-motifs/bird','08-graphics-motifs/flower','05-technologies/react'] as const).map(name=><div key={name} className="grid justify-items-center gap-2"><HydraIcon name={name} className="size-12"/><span className="text-xs">{name.split('/')[1]}</span></div>)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Actions</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-3"><Button><Play className="size-4" />Run scan</Button><Button variant="secondary">Enumerate</Button><Button variant="outline">Compare</Button><Button variant="ghost">Cancel</Button><Button variant="danger">Delete</Button></CardContent></Card>
        <Card><CardHeader><CardTitle>Severity</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2"><Badge severity="critical">Critical</Badge><Badge severity="high">High</Badge><Badge severity="medium">Medium</Badge><Badge severity="low">Low</Badge><Badge severity="info">Info</Badge></CardContent></Card>
        <Card><CardHeader><CardTitle>Inputs</CardTitle></CardHeader><CardContent className="grid gap-4"><Field label="Scan target" hint="Domain, IP, CIDR, or asset file"><Input leading={<Search className="size-4" />} placeholder="example.com" /></Field><Field label="Profile"><Select defaultValue="full"><option value="full">Full reconnaissance</option><option value="passive">Passive discovery</option></Select></Field><Field label="Notes" optional><Textarea placeholder="Context for the security team…" /></Field></CardContent></Card>
        <Card><CardHeader><CardTitle>Preferences</CardTitle></CardHeader><CardContent className="grid gap-5"><Checkbox label="Validate findings" description="Reduce false positives with safe verification." defaultChecked /><Switch label="Continuous monitoring" description="Watch the external attack surface." defaultChecked /><Alert tone="warning" icon={<TriangleAlert className="size-5" />} title="Potential disruption">Active checks may trigger defensive controls.</Alert></CardContent></Card>
        <Card className="lg:col-span-2"><CardHeader><CardTitle>Documents & evidence</CardTitle><Button variant="outline" size="sm"><FileDown className="size-4" />Export all</Button></CardHeader><CardContent className="grid gap-3 md:grid-cols-2"><DocumentCard name="executive-surface-report.pdf" kind="pdf" meta="2.4 MB · just now" /><DocumentCard name="asset-inventory.csv" kind="csv" meta="342 rows" /><DocumentCard name="scan-evidence.json" kind="json" meta="Signed" /><DocumentCard name="screenshots.zip" kind="archive" meta="18 files" /></CardContent></Card>
      </div>
    </div>
  );
}

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [view, setView] = useState('dashboard');
  const [animated,setAnimated]=useState(true);
  useEffect(()=>{const sync=()=>{const hash=decodeURIComponent(window.location.hash.slice(1));const known=['Inventory','dashboard','components','motion','footers','Settings',...navItems.map(n=>n.label)];setView(known.find(n=>n.toLowerCase()===hash.toLowerCase())??'dashboard');};sync();window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync);},[]);
  function navigate(next:string){window.location.hash=next;setView(next);}
  const [theme, setTheme] = useState<"nocturne" | "parchment">("nocturne");

  function toggleTheme() {
    const next = theme === "nocturne" ? "parchment" : "nocturne";
    document.documentElement.dataset.hydraTheme = next;
    setTheme(next);
  }

  return (
    <MotionProvider enabled={animated}><div className="flex min-h-screen bg-hydra-canvas text-hydra-text">
      <Sidebar open={mobileOpen} close={() => setMobileOpen(false)} view={view} navigate={navigate}/>
      {mobileOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-18 items-center gap-3 border-b border-hydra-line bg-hydra-canvas/90 px-4 backdrop-blur md:px-6">
          <button className="text-hydra-muted lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu /></button>
          <div className="flex rounded-hydra-sm border border-hydra-line bg-hydra-surface p-1">
            <button onClick={() => navigate("dashboard")} className={`rounded px-3 py-1.5 text-xs font-bold ${view === "dashboard" ? "bg-hydra-accent text-hydra-on-accent" : "text-hydra-muted"}`}>Product</button>
            <button onClick={() => navigate("components")} className={`rounded px-3 py-1.5 text-xs font-bold ${view === "components" ? "bg-hydra-accent text-hydra-on-accent" : "text-hydra-muted"}`}>Components</button>
          </div>
          <div className="mx-auto hidden max-w-xl flex-1 md:block"><Input leading={<Sparkles className="size-4" />} trailing={<span className="text-[0.65rem]">⌘ K</span>} placeholder="Target domain, IP, CIDR, or file…" /></div>
          <Button className="hidden sm:inline-flex"><Play className="size-4 fill-current" />Scan</Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={`Use ${theme === "nocturne" ? "light" : "dark"} theme`}>{theme === "nocturne" ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button>
          <Button variant="ghost" size="icon" aria-label="Notifications"><Bell className="size-4" /></Button>
          <div className="hidden items-center gap-2 xl:flex"><span className="grid size-8 place-items-center rounded-full bg-hydra-surface-strong text-hydra-accent"><Fingerprint className="size-4" /></span><span className="text-xs font-semibold">Hydra Security</span><ChevronRight className="size-3 text-hydra-muted" /></div>
        </header>
        <div className="flex items-center justify-between gap-4 border-b border-hydra-line px-6 py-3"><span className="text-sm capitalize">{view} · Showcase</span><Switch label="Animations" checked={animated} onChange={e=>setAnimated(e.target.checked)}/></div>
        <main><Motion key={view}>{view==='dashboard'?<Dashboard/>:view==='components'?<ComponentLab/>:<div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8"><h1 className="font-display text-3xl capitalize">{view}</h1>{view==='footers'?<FooterScreen/>:view==='motion'?<MotionScreen/>:<ProductScreen key={view} screen={view}/>}</div>}</Motion></main>
        <div className="p-4 md:p-6"><Footer variant="simple"/></div>
      </div>
    </div></MotionProvider>
  );
}
