# Changelog

## Unreleased

- Add a scoped, SSR-safe LocaleProvider with English/Spanish base-component messages, typed overrides and directional keyboard behavior; expose language/density/state previews.
- Generate public component props/defaults for the showcase and docs from TypeScript, with a stale-reference check in CI.
- Add reviewed visual baselines for themes, densities, application states, mobile and Spanish RTL; pin the Linux visual renderer and bundle showcase fonts for reproducibility.

- Make Firebase an optional peer for the separate `/firebase` entry. UI-only installations no longer install the Firebase SDK; Firebase consumers must declare it explicitly.
- Replace Anime.js and Framer Motion with native Web Animations/CSS while preserving shared reduced-motion, visibility and opt-out behavior; verify both UI-only and Firebase package consumers.

- Add form-aware Combobox, MultiSelect, TagsInput and DateRangePicker with keyboard selection, controlled values, native reset and validation.
- Add generic DataTable with stable sorting, persistent page selection, remote pagination and explicit loading/error/empty states; demonstrate all controls in the showcase.

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
