# Hydra UI

Hydra UI is the React and Tailwind CSS design system for **Hydra Security**. It turns the product direction—external attack-surface intelligence with a visual language rooted in El Salvador—into reusable, accessible primitives.

This repository contains:

- `packages/ui`: the publishable `@hydra-security/ui` component package.
- `apps/showcase`: a responsive product dashboard and component laboratory.
- semantic themes for dark product surfaces and light report/document surfaces.
- components for actions, forms, findings, progress, statistics, and evidence files.
- a custom vector Hydra mark. No external logo asset is required.

## Why it is not a daisyUI theme

daisyUI is a useful reference for API ergonomics, but using it as the foundation would couple Hydra's identity to generic component markup and global class names. Hydra UI instead uses typed React components, semantic design tokens, and Tailwind-generated CSS. Consumers get predictable variants without inheriting a second design system.

## Quick start

```bash
npm install
npm run dev
```

Run all checks:

```bash
npm run setup:firebase
npm run check
```

The full check includes Firebase rules emulators and requires Node 24 and Java 21.
`npm run build` checks types and component tests, then builds the library, showcase
and Firebase starter. `npm run audit` remains a separate mandatory CI gate.
The Firebase CLI has its own lockfile in `tools/firebase` and is installed only
for emulator work. `npm run audit` and CI include **both** dependency trees; this
CLI uses a corrected stream-json version with an explicitly verified compatibility
patch. See the [tooling guide](tools/firebase/README.md) for its scope and checks.

Build the package and showcase:

```bash
npm run build
```

## Install in another React app

Once the package is published or linked from a workspace:

```bash
npm install @hydra-security/ui
```

Import the generated stylesheet once at the application entry point:

```tsx
import "@hydra-security/ui/styles.css";
```

Then use components directly:

```tsx
import { Button, Field, Input, Stat } from "@hydra-security/ui";
import { Search } from "lucide-react";

export function ScanForm() {
  return (
    <form className="grid gap-4">
      <Field label="Scan target" hint="Domain, IP, CIDR, or file">
        <Input leading={<Search size={16} />} placeholder="example.com" />
      </Field>
      <Button type="submit">Run scan</Button>
      <Stat label="Discovered assets" value="342" delta="12%" trend="up" />
    </form>
  );
}
```

The package supports React 18.3 and 19. It ships ESM, CommonJS, TypeScript declarations, and compiled CSS.

## Hydra backend data

Open **Hydra runs** in the showcase to import a real `output/<run_id>/assets.json`
locally. The file stays in the tab. The screen includes paginated host review,
independent risk/confidence filters, finding observations and relationship evidence.
It does not initiate scans or claim that raw findings are verified vulnerabilities.

Use `@hydra-security/ui/hydra` for the validated export adapter and file importer;
use `HydraRunSummary`, `HydraHostInventory`, `HydraHostDetails`, `HydraRelationships`
and `ResourceState` from the main package for presentation.
See [backend integration](docs/backend-integration.md) for usage, the audited backend
revision, export limits and the API/authentication/job work still required for a
real multi-customer web application.

## Firebase application toolkit

Use `@hydra-security/ui/firebase` for `FirebaseProvider`, `Protected`, `PublicOnly`,
authentication and profile forms, verified-email workflows, organizations, roles,
membership management and scoped file uploads/downloads. Firebase initializes only
when your application explicitly supplies its public web configuration.

The package includes a runnable React starter and Firestore/Storage rules. See the
[setup guide](packages/ui/firebase/README.md) for installation, permissions,
emulator tests and the remaining production setup. No cloud project or rules are
deployed by installing the library.

The **App toolkit** showcase screen demonstrates `ScopeSummary`, `ScanJobList`,
`FindingReviewForm` and `AuditTimeline`. These accept application data and callbacks;
the example does not launch scans or persist an audit trail.

## Themes

The ocean/glass treatment, Framer Motion integration, accessible loader and account
screens are documented in [Ocean and accounts](docs/ocean-and-accounts.md).

Set the theme at any DOM boundary:

```html
<html data-hydra-theme="nocturne">
```

Available themes:

| Theme | Use |
|---|---|
| `nocturne` | Product dashboards, scanners, SOC and EASM interfaces |
| `parchment` | Reports, printable views, evidence summaries and marketing surfaces |

Themes use semantic variables. Product applications should consume `hydra-*` Tailwind utilities or components rather than hard-coded colors.

```css
[data-hydra-theme="customer"] {
  --hs-canvas: #071923;
  --hs-surface: #0c2936;
  --hs-accent: #ffb52a;
  --hs-text: #fff8e9;
}
```

## Components

| Area | Components |
|---|---|
| Actions | `Button` with primary, secondary, outline, ghost, and danger variants |
| Forms | `Field`, `Input`, `Select`, `Textarea`, `Checkbox`, `Switch` |
| Layout | `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` |
| Security data | `Badge`, `Stat`, `Progress`, `Alert` |
| Documents | `DocumentCard` for report, PDF, CSV, JSON, image, archive, code, and generic files |
| Brand | `HydraMark`, `FolkSun` |

All interactive components include visible keyboard focus, disabled states, and reduced-motion handling. `Field` automatically connects labels, hints, and error messages to its control.

## Design rules

1. **Clarity under pressure.** Severity is always expressed with text, never color alone.
2. **Cultural influence, not decoration everywhere.** Folk geometry appears in brand moments and accents; dense security data stays restrained.
3. **One semantic token layer.** Product themes may change values without changing component markup.
4. **Documents are first-class.** Reports and evidence use the same interaction language as live assets.
5. **No hidden framework dependency.** Components do not require daisyUI, Radix, or a runtime CSS-in-JS provider.

## Release path

The current version is an initial `0.1.0` foundation. Before publishing `1.0`, add:

- a formal icon package derived from the approved Hydra icon set;
- Storybook or another isolated documentation environment;
- automated accessibility checks with Axe;
- visual regression snapshots for both themes;
- provenance and package signing in the npm release workflow.

## License

MIT © Hydra Security
