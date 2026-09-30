# Changelog

## Unreleased

- Consolidate form identity and descriptions, inherit field state, preserve native size attributes and forward PasswordInput refs.
- Add accessible busy buttons, shared control geometry and scoped comfortable/compact density for forms, cards, tables and menus.
- Share collision-aware, native top-layer positioning between dropdowns and tooltips, preserving theme scope and nested dialog Escape behavior.
- Add an application foundations showcase and focused Chromium, Firefox and WebKit interaction/accessibility coverage.

- Pin the Firebase Node transport to `@grpc/grpc-js@1.13.6` in the workspace and bundled starter to resolve GHSA-m9gg-hp2v-232j and GHSA-f596-whhp-79r4 found by remote CI. Document the required consumer override; Firebase itself is not downgraded.

- Cover all 68 daisyUI component families with exported Vitral React components, including native dialogs/drawers, keyboard menus/tabs, a bounded date calendar, OTP, validation, galleries and mockups. No new dependency is required.
- Replace the small component lab with a searchable, categorized catalog, direct component links and usage examples; preserve Hydra-specific examples.
- Add keyboard, focus, constraint-validation and date-boundary tests; verify the full catalog in both themes and mobile layouts.

- Introduce Vitral: cool stained-glass tokens, original vector rose windows, faceted controls and Daylight/Nocturne themes with smooth color interpolation.
- Add scoped ThemeProvider, ThemeToggle and optional durable theme preference; retain legacy theme aliases.
- Replace illustrated asset nodes with a searchable point graph; add a deterministic d3-force layout helper and preserve drag, keyboard controls and position storage.
- Refresh the showcase and Firebase starter; document migration and the graph rendering limits.

- Add a reusable ErrorBoundary and recovery screens to the showcase and starter.
- Stop shared motion effects while the document is hidden.
- Add cursor pagination for organizations and member lists, with runtime member validation.
- Add a strict, cancellable account-deletion HTTP client and document the required backend contract. The cleanup backend remains an application responsibility.
- Add Playwright browser flows, axe accessibility checks, Firebase emulator integration and isolated npm-package installation to CI.
- Document component states, integration boundaries and release/versioning requirements.

Migration: the starter deletion endpoint must now return HTTP 204 (previously 200 was also accepted). Pending/queued responses never count as completed deletion.
