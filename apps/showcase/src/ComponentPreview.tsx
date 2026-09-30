import { useId, useState } from "react";
import * as UI from "@hydra-security/ui";
import {
  Bell,
  CircleDot,
  FileText,
  Network,
  ShieldCheck,
  Volume2,
  VolumeX,
} from "lucide-react";

const nav = [
  {
    id: "overview",
    label: "Overview",
    href: "#dashboard",
    icon: <CircleDot size={16} aria-hidden="true" />,
  },
  {
    id: "assets",
    label: "Assets",
    href: "#Inventory",
    icon: <Network size={16} aria-hidden="true" />,
  },
  {
    id: "reports",
    label: "Reports",
    href: "#Reports",
    icon: <FileText size={16} aria-hidden="true" />,
  },
];
function GlassPanel({
  variant = 0,
  title = "A wider perspective.",
}: {
  variant?: number;
  title?: string;
}) {
  return (
    <div className={`catalog-glass-panel catalog-glass-panel-${variant}`}>
      <UI.RoseWindow />
      <span>{title}</span>
    </div>
  );
}
const slides = [
  {
    id: "discover",
    label: "Discover",
    content: <GlassPanel title="Discover the unknown." />,
  },
  {
    id: "understand",
    label: "Understand",
    content: <GlassPanel variant={1} title="Every connection, in context." />,
  },
  {
    id: "protect",
    label: "Protect",
    content: <GlassPanel variant={2} title="Protect what matters." />,
  },
];
export default function ComponentPreview({ id }: { id: string }) {
  const [open, setOpen] = useState(false),
    [message, setMessage] = useState(""),
    [value, setValue] = useState(3),
    [choice, setChoice] = useState(""),
    [date, setDate] = useState("2026-09-30"),
    [toast, setToast] = useState(true);
  const uid = useId();
  const actions = [
    {
      id: "report",
      label: "Prepare report",
      onSelect: () => setMessage("Report prepared — demonstration only."),
    },
    {
      id: "copy",
      label: "Inspect asset ID",
      onSelect: () => setMessage("Asset ID selected: asset-demo-01."),
    },
    {
      id: "delete",
      label: "Delete (unavailable)",
      onSelect: () => {},
      disabled: true,
    },
  ];
  const note = (
    <p className="catalog-demo-note" role="status">
      {message || "Demonstration only. No scan or account changes."}
    </p>
  );
  switch (id) {
    case "button":
      return (
        <div className="catalog-demo-stack">
          <div className="catalog-demo-row">
            <UI.Button onClick={() => setMessage("Scan action previewed.")}>
              Run scan
            </UI.Button>
            <UI.Button
              variant="secondary"
              onClick={() => setMessage("Analysis action previewed.")}
            >
              Analyze
            </UI.Button>
            <UI.Button
              variant="outline"
              onClick={() => setMessage("Comparison action previewed.")}
            >
              Compare
            </UI.Button>
            <UI.Button variant="ghost" onClick={() => setMessage("Cancelled.")}>
              Cancel
            </UI.Button>
            <UI.Button
              variant="danger"
              onClick={() =>
                setMessage("Delete action previewed. Nothing was removed.")
              }
            >
              Delete
            </UI.Button>
            <UI.Button disabled>Unavailable</UI.Button>
          </div>
          {note}
        </div>
      );
    case "dropdown":
      return (
        <div className="catalog-demo-stack">
          <UI.Dropdown label="Asset actions" items={actions} />
          {note}
        </div>
      );
    case "fab":
      return (
        <div className="catalog-demo-stack catalog-fab-demo">
          <UI.Fab label="Create" actions={actions} />
          {note}
        </div>
      );
    case "modal":
      return (
        <>
          <UI.Button onClick={() => setOpen(true)}>Review scope</UI.Button>
          <UI.Modal
            open={open}
            onOpenChange={setOpen}
            title="Review authorized scope"
            description="This dialog is a component demonstration."
            footer={
              <UI.Button
                onClick={() => {
                  setOpen(false);
                  setMessage("Scope confirmed for this preview.");
                }}
              >
                Confirm scope
              </UI.Button>
            }
          >
            <UI.Field label="Approved domain">
              <UI.Input defaultValue="example.com" />
            </UI.Field>
          </UI.Modal>
          {note}
        </>
      );
    case "swap":
      return (
        <div className="catalog-demo-row">
          <UI.Swap
            label="Mute notifications"
            on={<VolumeX size={20} />}
            off={<Volume2 size={20} />}
            onCheckedChange={(muted) =>
              setMessage(
                muted ? "Notifications muted." : "Notifications enabled.",
              )
            }
          />
          {note}
        </div>
      );
    case "theme-controller":
      return <UI.ThemeController label="Preview theme" />;
    case "accordion":
      return (
        <UI.Accordion
          items={[
            {
              id: "scope",
              title: "What is in scope?",
              content: "Only domains explicitly approved by your organization.",
            },
            {
              id: "evidence",
              title: "Where is the evidence?",
              content: "Every relationship links back to its observed source.",
            },
            {
              id: "review",
              title: "Who can approve a scan?",
              content:
                "An authorized member with the appropriate organization role.",
            },
          ]}
        />
      );
    case "avatar":
      return (
        <div className="catalog-demo-row">
          <UI.Avatar name="Alex Morgan" size="sm" />
          <UI.Avatar name="Jordan Lee" />
          <UI.Avatar name="Hydra Security" size="lg" />
        </div>
      );
    case "aura":
      return (
        <UI.Aura>
          <UI.Card>
            <UI.CardContent className="p-5">
              <UI.Status tone="info" label="Priority review" />
              <p className="mt-3 text-sm">One clear focal point.</p>
            </UI.CardContent>
          </UI.Card>
        </UI.Aura>
      );
    case "badge":
      return (
        <div className="catalog-demo-row">
          {(
            ["neutral", "info", "low", "medium", "high", "critical"] as const
          ).map((severity) => (
            <UI.Badge key={severity} severity={severity}>
              {severity}
            </UI.Badge>
          ))}
        </div>
      );
    case "card":
      return (
        <UI.Card>
          <UI.CardHeader>
            <UI.CardTitle>External surface</UI.CardTitle>
            <ShieldCheck size={18} aria-hidden="true" />
          </UI.CardHeader>
          <UI.CardContent>
            <p className="text-sm text-hydra-muted">
              30 live hosts. Every asset has a place.
            </p>
          </UI.CardContent>
          <UI.CardFooter>
            <UI.Link href="#Inventory">Inspect assets →</UI.Link>
          </UI.CardFooter>
        </UI.Card>
      );
    case "carousel":
      return <UI.Carousel label="Vitral perspectives" items={slides} />;
    case "chat":
      return (
        <div className="catalog-demo-stack">
          <UI.ChatBubble
            author="Alex"
            time="10:42"
            avatar={<UI.Avatar name="Alex Morgan" size="sm" />}
          >
            The new domain is ready for review.
          </UI.ChatBubble>
          <UI.ChatBubble author="Jordan" time="10:44" align="end">
            Scope confirmed.
          </UI.ChatBubble>
        </div>
      );
    case "collapse":
      return (
        <UI.Collapse title="View certificate evidence">
          <p>Subject: api.example.com</p>
          <p>Observed on 30 September 2026.</p>
        </UI.Collapse>
      );
    case "countdown":
      return (
        <div className="catalog-demo-row">
          <UI.Countdown value={value} label="Seconds" />
          <UI.Button
            size="sm"
            variant="outline"
            onClick={() => setValue((v) => (v > 0 ? v - 1 : 10))}
          >
            Advance counter
          </UI.Button>
        </div>
      );
    case "diff":
      return (
        <UI.Diff
          before={<GlassPanel title="Before review" />}
          after={<GlassPanel variant={2} title="After review" />}
          label="Reveal comparison"
        />
      );
    case "hover-3d":
      return (
        <UI.HoverCard>
          <UI.Card>
            <UI.CardContent className="p-5">
              <UI.RoseWindow className="mx-auto size-24" />
              <p className="mt-4 text-center text-sm">
                Move the pointer across the glass.
              </p>
            </UI.CardContent>
          </UI.Card>
        </UI.HoverCard>
      );
    case "hover-gallery":
      return <UI.HoverGallery label="Glass perspectives" items={slides} />;
    case "kbd":
      return (
        <div className="catalog-demo-row">
          <UI.Kbd>Ctrl</UI.Kbd>
          <span>+</span>
          <UI.Kbd>K</UI.Kbd>
          <span className="catalog-demo-note">Example shortcut</span>
        </div>
      );
    case "list":
      return (
        <UI.List>
          <li>
            <span>api.example.com</span>
            <UI.Status label="Live" />
          </li>
          <li>
            <span>mail.example.com</span>
            <UI.Status tone="warning" label="Review" />
          </li>
          <li>
            <span>cdn.example.com</span>
            <UI.Status label="Live" />
          </li>
        </UI.List>
      );
    case "stat":
      return (
        <UI.Stat
          label="Live hosts"
          value={30}
          delta="8%"
          trend="up"
          icon={<Network size={18} />}
        />
      );
    case "status":
      return (
        <div className="catalog-demo-stack">
          <UI.Status label="Connected" />
          <UI.Status tone="warning" label="Awaiting review" />
          <UI.Status tone="danger" label="Service unavailable" />
          <UI.Status tone="neutral" label="Offline" />
        </div>
      );
    case "table":
      return (
        <UI.Table>
          <caption>Example assets · demonstration data</caption>
          <thead>
            <tr>
              <th scope="col">Host</th>
              <th scope="col">Service</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>api.example.com</td>
              <td>HTTPS</td>
              <td>Live</td>
            </tr>
            <tr>
              <td>mail.example.com</td>
              <td>SMTP</td>
              <td>Review</td>
            </tr>
          </tbody>
        </UI.Table>
      );
    case "text-rotate":
      return <UI.TextRotate items={["Discover.", "Understand.", "Protect."]} />;
    case "timeline":
      return (
        <UI.Timeline
          items={[
            {
              id: "1",
              title: "Scope approved",
              time: "10:00",
              dateTime: "2026-09-30T10:00:00Z",
              description: "example.com",
            },
            {
              id: "2",
              title: "Discovery completed",
              time: "10:02",
              description: "30 live hosts observed.",
            },
            {
              id: "3",
              title: "Review ready",
              time: "10:04",
              description: "4 findings require attention.",
            },
          ]}
        />
      );
    case "breadcrumbs":
      return (
        <UI.Breadcrumbs
          items={[
            { label: "Hydra", href: "#dashboard" },
            { label: "Assets", href: "#Inventory" },
            { label: "api.example.com" },
          ]}
        />
      );
    case "dock":
      return <UI.Dock items={nav} activeId="assets" label="Dock preview" />;
    case "link":
      return (
        <div className="catalog-demo-stack">
          <UI.Link href="#dashboard">Open surface overview →</UI.Link>
          <UI.Link href="#components/button">
            Explore the Button component →
          </UI.Link>
        </div>
      );
    case "megamenu":
      return (
        <UI.MegaMenu
          label="Explore Hydra"
          groups={[
            { title: "Workspace", items: nav },
            {
              title: "Design system",
              items: [
                {
                  id: "controls",
                  label: "Controls",
                  href: "#components/input",
                },
                {
                  id: "themes",
                  label: "Themes",
                  href: "#components/theme-controller",
                },
              ],
            },
          ]}
        />
      );
    case "menu":
      return (
        <UI.Menu
          items={[
            ...nav,
            {
              id: "disabled",
              label: "Billing (unavailable)",
              href: "#components/menu",
              disabled: true,
            },
          ]}
          label="Menu preview"
          activeId="overview"
        />
      );
    case "navbar":
      return (
        <UI.Navbar
          brand="HYDRA"
          actions={
            <UI.Button
              size="sm"
              variant="outline"
              onClick={() => setMessage("New scan action previewed.")}
            >
              New scan
            </UI.Button>
          }
        >
          <UI.Link href="#dashboard">Overview</UI.Link>
          {message && (
            <p role="status" className="catalog-demo-note">
              {message}
            </p>
          )}
        </UI.Navbar>
      );
    case "pagination":
      return (
        <div className="catalog-demo-stack">
          <UI.Pagination page={value} totalPages={12} onPageChange={setValue} />
          <p role="status" className="catalog-demo-note">
            Showing page {value} of 12
          </p>
        </div>
      );
    case "steps":
      return (
        <UI.Steps steps={["Scope", "Review", "Run", "Report"]} current={1} />
      );
    case "tab":
      return (
        <UI.Tabs
          label="Asset details"
          items={[
            {
              id: "overview",
              label: "Overview",
              content: "api.example.com · HTTPS · live",
            },
            {
              id: "evidence",
              label: "Evidence",
              content: "Certificate matches the approved domain.",
            },
            {
              id: "history",
              label: "History",
              content: "First observed: 30 September 2026.",
            },
            {
              id: "disabled",
              label: "Restricted",
              content: "",
              disabled: true,
            },
          ]}
        />
      );
    case "alert":
      return (
        <div className="catalog-demo-stack">
          <UI.Alert tone="info" title="Discovery complete">
            30 hosts are ready for review.
          </UI.Alert>
          <UI.Alert tone="warning" title="Review required">
            Confirm the scope before scanning.
          </UI.Alert>
        </div>
      );
    case "loading":
      return (
        <div className="catalog-demo-stack">
          <UI.Loading label="Resolving hosts" />
          <UI.Loading label="Analyzing evidence" variant="dots" />
          <UI.Loading label="Preparing report" variant="bars" />
        </div>
      );
    case "progress":
      return (
        <div className="catalog-demo-stack">
          <UI.Progress value={68} label="Discovery" />
          <UI.Progress value={100} label="Validation" />
        </div>
      );
    case "radial-progress":
      return (
        <div className="catalog-demo-row">
          <UI.RadialProgress value={72} label="Review completion" />
          <span className="catalog-demo-note">Review completion</span>
        </div>
      );
    case "skeleton":
      return (
        <div className="catalog-demo-stack">
          <UI.Skeleton className="h-20" label="Loading summary" />
          <UI.Skeleton className="h-3 w-3/4" label="Loading asset name" />
          <UI.Skeleton className="h-3 w-1/2" label="Loading asset details" />
        </div>
      );
    case "toast":
      return toast ? (
        <UI.Toast tone="success" onDismiss={() => setToast(false)}>
          Preferences saved.
        </UI.Toast>
      ) : (
        <UI.Button variant="outline" onClick={() => setToast(true)}>
          Show notification
        </UI.Button>
      );
    case "tooltip":
      return (
        <div className="catalog-tooltip-demo">
          <UI.Tooltip content="Download a local JSON report">
            <UI.Button variant="outline">Export report</UI.Button>
          </UI.Tooltip>
        </div>
      );
    case "calendar":
      return (
        <div className="catalog-demo-stack">
          <UI.Calendar
            value={date}
            onValueChange={setDate}
            label="Review date"
            min="2026-09-01"
            max="2026-12-31"
          />
          <p className="catalog-demo-note" role="status">
            Selected date: {date}
          </p>
        </div>
      );
    case "checkbox":
      return (
        <div className="catalog-demo-stack">
          <UI.Checkbox
            label="Validate findings"
            description="Confirm observations before review."
            defaultChecked
          />
          <UI.Checkbox label="Unavailable option" disabled />
        </div>
      );
    case "fieldset":
      return (
        <UI.Fieldset
          legend="Monitoring preferences"
          description="Applies to this workspace."
        >
          <UI.Checkbox label="Weekly summaries" defaultChecked />
          <UI.Switch label="Notify on changes" />
        </UI.Fieldset>
      );
    case "file-input":
      return <UI.FileInput label="Asset list" accept=".csv,.json" />;
    case "filter":
      return (
        <UI.Filter
          label="Severity"
          options={[
            { value: "critical", label: "Critical" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
          ]}
          value={choice}
          onValueChange={setChoice}
        />
      );
    case "label":
      return (
        <div>
          <UI.Label htmlFor={uid}>Organization</UI.Label>
          <UI.Input id={uid} placeholder="Hydra Security" />
        </div>
      );
    case "radio":
      return (
        <UI.Fieldset legend="Scan profile">
          <UI.Radio
            name={uid}
            label="Passive discovery"
            value="passive"
            defaultChecked
          />
          <UI.Radio name={uid} label="Authorized active scan" value="active" />
          <UI.Radio
            name={uid}
            label="Unavailable profile"
            value="unavailable"
            disabled
          />
        </UI.Fieldset>
      );
    case "range":
      return (
        <div className="catalog-demo-stack">
          <UI.RangeInput
            label="Concurrency"
            min={1}
            max={10}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
          <output className="catalog-demo-note">{value} parallel tasks</output>
        </div>
      );
    case "rating":
      return (
        <div className="catalog-demo-stack">
          <UI.Rating
            label="Evidence quality"
            value={value}
            onValueChange={setValue}
          />
          <p className="catalog-demo-note" role="status">
            {value} of 5
          </p>
        </div>
      );
    case "select":
      return (
        <UI.Field label="Collection profile">
          <UI.Select defaultValue="passive">
            <option value="passive">Passive discovery</option>
            <option value="active">Authorized active scan</option>
            <option disabled>Unavailable profile</option>
          </UI.Select>
        </UI.Field>
      );
    case "input":
      return (
        <div className="catalog-demo-stack">
          <UI.Field label="Scan target" hint="Domain without a protocol.">
            <UI.Input placeholder="example.com" />
          </UI.Field>
          <UI.Field
            label="Validation state"
            error="Enter a domain without a protocol."
          >
            <UI.Input defaultValue="https://example.com" />
          </UI.Field>
          <UI.Field label="Unavailable field">
            <UI.Input disabled defaultValue="Managed by organization" />
          </UI.Field>
        </div>
      );
    case "textarea":
      return (
        <UI.Field label="Investigation notes" optional>
          <UI.Textarea placeholder="Context for the security team…" />
        </UI.Field>
      );
    case "toggle":
      return (
        <div className="catalog-demo-stack">
          <UI.Switch
            label="Continuous monitoring"
            description="Watch the external attack surface."
            defaultChecked
          />
          <UI.Switch label="Organization preference" disabled />
        </div>
      );
    case "validator":
      return (
        <UI.Validator
          onValidSubmit={(data) =>
            setMessage(`Valid email: ${data.get("email")}. Nothing was sent.`)
          }
        >
          <UI.Field
            label="Report email"
            hint="A valid email address is required."
          >
            <UI.Input
              type="email"
              name="email"
              placeholder="analyst@example.com"
              required
            />
          </UI.Field>
          <UI.Button type="submit">Validate email</UI.Button>
          {note}
        </UI.Validator>
      );
    case "otp":
      return (
        <div className="catalog-demo-stack">
          <UI.OtpInput
            label="Verification code"
            length={6}
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            aria-describedby={`${uid}-hint`}
          />
          <p id={`${uid}-hint`} className="catalog-demo-note">
            Six digits. Paste and autofill use a single native field.
          </p>
          <p role="status" className="catalog-demo-note">
            {/^\d{6}$/.test(choice)
              ? "Code format is valid. No authentication request was sent."
              : "Enter a six-digit code."}
          </p>
        </div>
      );
    case "divider":
      return (
        <div className="catalog-demo-stack">
          <UI.Divider />
          <UI.Divider>or continue with</UI.Divider>
          <div className="catalog-demo-row">
            <span>Discover</span>
            <UI.Divider orientation="vertical" />
            <span>Protect</span>
          </div>
        </div>
      );
    case "drawer":
      return (
        <>
          <UI.Button variant="outline" onClick={() => setOpen(true)}>
            Open workspace drawer
          </UI.Button>
          <UI.Drawer
            open={open}
            onOpenChange={setOpen}
            title="Workspace navigation"
            side="right"
          >
            <UI.Menu items={nav} label="Drawer navigation" />
          </UI.Drawer>
        </>
      );
    case "footer":
      return <UI.Footer variant="simple" copyright="Hydra Security" />;
    case "hero":
      return (
        <UI.Hero
          title="Clarity beyond the horizon."
          description="Bring your unknown assets into the light."
          artwork={<UI.RoseWindow />}
          actions={<UI.Link href="#dashboard">Explore surface →</UI.Link>}
        />
      );
    case "indicator":
      return (
        <div className="catalog-demo-row">
          <UI.Indicator indicator={<UI.Badge severity="info">3</UI.Badge>}>
            <UI.Avatar name="Alex Morgan" size="lg" />
          </UI.Indicator>
          <span className="catalog-demo-note">3 unread updates</span>
          <Bell size={18} aria-hidden="true" />
        </div>
      );
    case "join":
      return (
        <UI.Join>
          {["Day", "Week", "Month"].map((period) => (
            <UI.Button
              key={period}
              variant={(choice || "Week") === period ? "primary" : "outline"}
              aria-pressed={(choice || "Week") === period}
              onClick={() => setChoice(period)}
            >
              {period}
            </UI.Button>
          ))}
        </UI.Join>
      );
    case "mask":
      return (
        <div className="catalog-demo-row">
          {(["circle", "hexagon", "diamond", "squircle"] as const).map(
            (shape) => (
              <UI.Mask key={shape} shape={shape} className="size-16">
                <GlassPanel />
              </UI.Mask>
            ),
          )}
        </div>
      );
    case "stack":
      return (
        <UI.Stack>
          <UI.Card>
            <UI.CardContent className="p-6">
              <UI.Badge severity="info">Latest report</UI.Badge>
              <p className="mt-3 text-sm">Your surface, in focus.</p>
            </UI.CardContent>
          </UI.Card>
          <UI.Card aria-hidden="true" className="h-24" />
          <UI.Card aria-hidden="true" className="h-24" />
        </UI.Stack>
      );
    case "mockup-browser":
      return (
        <UI.BrowserMockup url="hydra.example.com">
          <UI.Status label="Surface monitored" />
          <UI.Progress className="mt-5" label="Scan" value={100} />
        </UI.BrowserMockup>
      );
    case "mockup-code":
      return (
        <UI.CodeMockup
          language="tsx"
          caption="Install and compose"
          code={
            'import { Button } from "@hydra-security/ui";\nimport "@hydra-security/ui/styles.css";\n\n<Button>Run scan</Button>'
          }
        />
      );
    case "mockup-phone":
      return (
        <UI.PhoneMockup>
          <UI.RoseWindow className="mx-auto size-24" />
          <p className="my-4 text-center text-sm font-semibold">HYDRA</p>
          <UI.Progress value={100} label="Surface mapped" />
        </UI.PhoneMockup>
      );
    case "mockup-window":
      return (
        <UI.WindowMockup title="Hydra · activity">
          <UI.Status label="Scan completed" />
          <p className="mt-4 font-mono text-xs text-hydra-muted">
            30 hosts · 32 subdomains
            <br />4 findings ready for review
          </p>
        </UI.WindowMockup>
      );
    default:
      return <UI.Alert tone="danger">Unknown component: {id}</UI.Alert>;
  }
}
