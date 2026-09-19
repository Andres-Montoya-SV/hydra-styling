# Illustrated asset map

`AssetMap` renders typed `MapAsset[]` and `MapRelation[]` as an inline SVG graph.
The 1000 × 520 logical canvas uses supplied `x`/`y` coordinates; this is a curated
layout, not an automatic graph-layout engine. Keep labels and nodes spaced out.
Unique IDs, supported asset kinds, nonempty labels and finite bounded coordinates
are required. Invalid runtime data produces an accessible error instead of silently
hiding relationships. Duplicate relationships and dangling endpoints are rejected.
`validateAssetGraph(unknown, unknown)` exposes the same validation for API adapters.
This validates the data contract, not whether a domain is owned, reachable or vulnerable.

Domain and subdomain houses, IP globes, service racks and vulnerability triangles
are original code-native vector artwork. Decorative vegetation can be disabled
with `decorative={false}`. Colors and text identify type; risk detail belongs in
node `detail`. No arbitrary SVG/HTML injection or external asset fetches occur.

Zoom ranges from 75% to 250%. Drag background to pan; focus the canvas and use arrow
keys to pan or Home to reset. Fit resets to the documented logical canvas. Expand
enlarges in place and allows scrolling; it does not request browser fullscreen.
Nodes support Tab, Enter and Space. Drag a node to move it; its links update as it
moves. Pointer coordinates account for zoom, pan and SVG letterboxing. Arrow keys
move the focused node by 10 units; Shift moves by 1. Escape, pointer cancellation
or lost capture rolls back the current drag. Nodes cannot be deleted by map controls.
The parent application remains authoritative over the supplied asset list.
Selected relationships appear as text below.
Long labels are shortened visually but their full text remains in the accessible
name, SVG title and selection details. Callbacks expose selected domain data.

This scene intentionally uses a dark geographic surface in both application themes
to retain the supplied visual direction. It has no perpetual motion or hover-only
information. It is intended for small, curated graphs, not thousands of nodes;
large EASM inventories need clustering and layout/virtualization before use here.
The showcase has example data and makes no claim of live network discovery.

## Positions and relationships

```tsx
<AssetMap nodes={nodes} edges={edges}
  storageKey={`hydra:layout:${tenantId}:${userId}:${mapId}:v1`}
  onLayoutChange={positions => savePositions(positions)} />
```

Use a distinct, stable storage key for every tenant/user/map. With no key, positions
last for the mounted session. Browser storage contains only IDs and coordinates;
it does not synchronize across devices. `onLayoutChange` receives all asset IDs and
positions after a drop or keyboard move; the application handles backend persistence,
authorization, error feedback and concurrency. Apply backend coordinates via `nodes`.
Stored positions override supplied coordinates for known IDs; new assets keep their
supplied positions, stale IDs are ignored, corrupt/unavailable storage reports a
message. Clear this key to replace a saved layout with a new server layout.

Edges attach to glyph/label envelopes and show direction arrows. Parallel/reverse
links have separate curves; self-links form loops. There is no obstacle-routing or
collision-avoidance engine: deliberately overlapping nodes can obscure links. Keep
the curated layout spaced out. Dragged positions are constrained to the canvas.

## Inventory

`AssetInventory` accepts `InventoryAsset[]`, with search and type/risk/ownership
filters, accessible table and an evidence detail panel. `validateInventory` checks
IDs, labels, classification, evidence, source and canonical UTC timestamps at runtime.
Unknown risk is distinct from low risk; discovery does not establish ownership.
The showcase's **Asset inventory** screen uses explicitly synthetic data.

## Validation commands

- `npm run dev`: UI typecheck/tests/build, showcase typecheck, then dev server.
- `npm run build` or `npm run check`: the same checks, then the production build.
- `npm run prod` or `npm run preview`: validated production build, then local Vite preview.
- `npm test`: unit and DOM interaction tests without building.

Workspace build/dev/preview commands also run the gate. Commands use explicit `&&`
chains, not lifecycle prehooks suppressed by the repository's `ignore-scripts=true`.
CI continues to run `npm run check`. Tests run before startup/build; runtime graph and
inventory validation stays in the shipped components. During an ongoing dev session,
rerun `npm test` after edits (or `npm exec -w @hydra-security/ui -- vitest` to watch).
Vite preview is a local production-build preview, not a production hosting service.
Deploy the validated build with your hosting provider. These checks do not guarantee
external API correctness, browser compatibility or the absence of security issues.
