# Application composition contracts

Use `/#components/consistency` to inspect shared states. Every catalog detail page
also includes generated props, declared defaults and live language/density controls.
The complete [public API reference](api.md) is generated from TypeScript; run
`npm run docs:api` after changing public types. CI's `npm run docs:check` fails on
stale generated files. The source types remain the complete contract, including
native HTML attributes and defaults derived at runtime.

| Family | State contract | Application responsibility |
| --- | --- | --- |
| Button | `loading` disables activation, retains the action name/width and announces progress; disabled is inert | Resolve promises, handle errors and provide a specific loading label when useful |
| Field / input / select / textarea | Shared `controlSize`; Field connects label/help/error and inherits required/disabled/read-only state | Supply useful labels, validation text and controlled values when required |
| Checkbox / radio / switch | Native checked/disabled behavior and form names | Use disabled for a non-editable checkbox; native checkboxes have no read-only contract |
| Combobox / MultiSelect | Editable query is separate from committed option keys; keyboard selection, empty/loading states, optional limits | Fetch options, cancel stale requests and retain labels for committed keys |
| TagsInput | Enter/comma commits; paste deduplicates; limits/custom errors retain rejected text and block submission | Supply domain-specific validation and limits |
| DateRangePicker / Calendar | ISO values; native range validity; bounded calendar and keyboard navigation | Set business bounds and timezone semantics; the calendar week starts Sunday |
| DataTable | Immutable sorting, bounded pages, stable selection, loading/error/empty states | Supply stable IDs; own remote pages, retries and selection cleanup after deletion |
| Modal / Drawer | Open state is caller-owned; Escape closes the innermost overlay and focus returns to the trigger | Choose when opening/closing is appropriate and handle unsaved work |
| Dropdown / Tooltip | Native top layer, collision handling, keyboard dismissal, inherited tokens | Provide short named actions/content; older browsers use a fixed-position fallback |
| Alert / Toast / ResourceState | Named status/error/recovery; optional custom alert actions and dismissal | Supply context, recovery and message lifetime; never rely solely on color |
| Snackbar / NotificationProvider | Scoped bounded queue, optional paused timers, async actions, localized recovery | Own I/O and translated messages; handle full queue with inline feedback |
| AlertDialog / Popover | Explicit modal confirmation or non-modal rich content with focus/dismissal contracts | Own open state, successful confirmation, errors and pending state |
| Tabs / pagination / menu | Semantic navigation, active/current state, bounded keyboard movement | Provide destinations, selected value or fetched page |
| Gallery / rotating text | Named navigation, motion opt-out and pause behavior | Supply meaningful item labels and media alternatives |
| Card / layout / mockups | Presentational composition with shared surfaces and spacing | Supply headings/content; do not use a static mockup as a real interactive control |
| Theme / density / locale / motion | Nested scopes; tokens and behavior inherited by child controls | Choose product defaults once at the application boundary |

## Defaults and overrides

Prefer provider-level decisions for language, theme and density, then local
overrides for a specific screen. `size` on Button and `controlSize` on form controls
share geometry (`sm`, `md`, `lg`). Comfortable remains the touch-friendly default;
compact is appropriate for dense desktop work. Preserve a logical focus order and
provide named icon-only actions.

Use `value` + callback for controlled components or `defaultValue` for local state.
Do not switch a component between those modes during its lifetime. Native form
reset restores uncontrolled data controls; controlled reset belongs to the parent.
An error message should explain how to recover. Loading never implies success,
and an empty result should be distinguishable from a request error.

Examples and demo records are local. The core library does not fetch application
data, authorize operations or upload selected files. See the separate Firebase and
Hydra backend guides when integrating those features.

## Verification boundaries

Unit tests cover behavior and value ownership; Chromium desktop/mobile, Firefox
and WebKit cover form/floating/data/locale interactions. Axe checks supported
accessibility rules. [Visual baselines](visual-testing.md) cover a representative
composition across themes, densities and states. These layers complement manual
keyboard, screen-reader and product-content review; screenshots are not a claim
of exhaustive coverage of every possible combination of all 68 families.

See [application feedback](notifications.md), [localization boundaries](localization.md) and [shadcn pattern mappings](shadcn-coverage.md).
