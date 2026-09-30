# Vitral — Hydra's stained-glass system

Vitral translates leaded glass into a quiet security interface: cold blue panes,
cyan transmitted light, restrained violet, and fine structural seams. Original
vector geometry evokes a rose window without importing religious figures or stock
photography. Warm colors are reserved for findings and status, not decoration.

## Themes and migration

| Theme | Appearance | Compatible aliases |
| --- | --- | --- |
| `nocturne` | Deep navy, illuminated points and edges | `dark` |
| `daylight` | Icy white, refracted blue/violet and dark readable text | `light`, `parchment` |

Existing semantic utilities and component props continue to work. `parchment`
now means the cool light theme; `Card variant="parchment"` becomes an ice-glass
inset. `OceanBackground` is retained as a deprecated alias of `VitralBackground`.
`FolkSun` and the old graphic motifs remain available for existing imports; the
new showcase uses `RoseWindow`, `VitralBackdrop` and monochrome interface symbols.
The Hydra logo geometry is preserved, with cool glass colors.

```tsx
import {
  MotionProvider, ThemeProvider, ThemeToggle, VitralBackground,
  Button, Field, Input, Card,
} from '@hydra-security/ui';
import '@hydra-security/ui/styles.css';

<MotionProvider enabled={animationsEnabled}>
  <ThemeProvider defaultTheme="nocturne" storageKey="my-app:theme">
    <div className="hydra-ocean-shell">
      <VitralBackground />
      <ThemeToggle />
      <Card className="p-6">
        <Field label="Authorized domain"><Input placeholder="example.com" /></Field>
        <Button>Review scope</Button>
      </Card>
    </div>
  </ThemeProvider>
</MotionProvider>
```

`ThemeProvider` scopes tokens to its wrapper, so two providers can coexist. The
optional storage key persists only the theme and synchronizes changes across tabs.
Blocked storage falls back to the current session. Server rendering uses
`defaultTheme`; the saved preference is applied after hydration. Applications that
need a persisted first paint should supply a cookie-derived `defaultTheme`.
For Next.js, place the provider and interactive components behind your app's
`"use client"` boundary. CSS-only consumers can set `data-hydra-theme` directly.

Registered color properties interpolate gradients, panes, SVG and controls over
700 ms. Browsers without CSS property registration still receive both complete
themes, but may switch gradient colors immediately. Reduced-motion and a disabled
`MotionProvider` remove the transition. Background art has no pointer events,
no network requests and no continuously running animation. Never place high
contrast glass artwork behind table rows, form labels or risk details.

## Point graph

`AssetMap` keeps its nodes/edges, selection callback, drag, pan, zoom, keyboard
movement and version-1 layout storage contract. Circles replace all houses,
server glyphs and vegetation. Node kinds have distinct token colors, accessible
names, a legend and a textual detail panel; vulnerabilities also have a `!` mark.
Arrows show direction on selected relationships. Parallel edges and self-loops
remain visible. Searching emphasizes matches without removing graph data.
Labels can be toggled and always appear on hover/focus/selection. Coordinates
remain in a 1000 × 520 world; use the controls to zoom and pan on touch screens.
`decorative` now enables a subtle point grid, never illustrated objects.

```tsx
import {AssetMap, layoutAssetGraph} from '@hydra-security/ui';

// Compute only when topology changes; cache or use a worker for large graphs.
const positioned = layoutAssetGraph(nodes, edges);
<AssetMap
  nodes={positioned}
  edges={edges}
  storageKey={`organization:${organizationId}:graph`}
  onSelect={inspectAsset}
  onLayoutChange={savePositions}
/>
```

`layoutAssetGraph` uses d3-force with a deterministic, bounded static simulation.
It copies inputs and stops the timer immediately. It does not continuously move
assets while someone investigates or overwrite dragged positions. Compute large
layouts in a worker before passing them to the component. The existing validation
ceiling is 1,000 nodes / 5,000 edges; this SVG component is not a WebGL renderer for
millions of observations. The showcase's 97-node fixture uses reserved example
names and documentation addresses. It is not connected to BBOT or a live scanner.
BBOT's demo is a visual reference; no BBOT AGPL visualizer code is copied.

## Verification

The component suite covers theme aliases, storage errors, server rendering,
force-layout immutability, point-edge geometry, adding upstream assets, search,
keyboard selection, drag rollback and persistence. Playwright covers both themes,
responsive overflow, axe checks, interaction, saved themes and reduced motion.
Preview images in `docs/previews` are captured from the built showcase.

## Visual previews

[Nocturne](previews/vitral-nocturne.jpg) · [Daylight](previews/vitral-daylight.jpg) ·
[Controls](previews/vitral-controls.jpg) · [Mobile](previews/vitral-mobile.jpg)

Local verification: 133 component tests, 18 browser cases across desktop and
390 px mobile (including axe on dashboards, controls and account previews),
production builds, type checks, isolated package installation, ESM/CJS exports
and an application dependency audit with zero reported vulnerabilities.
The local browser is Chromium 138 because the configured Playwright browser
download returned an invalid archive in this environment. GitHub Actions is
responsible for the standard configured-browser and Firebase emulator gates.
A 1,000-node / 999-edge static layout took about 1.0 s here; use a worker for
large layouts rather than computing one during an interactive render.
