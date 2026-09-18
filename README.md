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
npm run check
```

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

## Themes

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
