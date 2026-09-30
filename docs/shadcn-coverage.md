# shadcn pattern compatibility

Reviewed against the [shadcn component index](https://ui.shadcn.com/docs/components)
on 2026-09-30. These are **behavioral mappings**, not drop-in API compatibility.
Hydra retains Vitral tokens, native controls, scoped providers and its existing
exports. This change adds no shadcn, Radix, Base UI or notification dependency.

The index has 64 families. The table names every family, including explicit gaps.
“Composition” means application code must assemble existing primitives; it does not
claim a dedicated, tested equivalent. Components sharing a name can differ.

| shadcn families | Hydra path | Assessment |
| --- | --- | --- |
| Accordion, Collapsible | `Accordion`, `Collapse` | Existing native disclosure behavior |
| Alert | `Alert` | Extended with custom title/icon/actions, outline variant and optional dismissal |
| Alert Dialog | `AlertDialog` | Added: native modal, cancel-first focus, controlled confirmation |
| Aspect Ratio | CSS `aspect-ratio` | Composition; no dedicated export |
| Attachment | `FileInput`, `DocumentCard` | Composition; upload, preview and download lifecycle remains application-owned |
| Avatar, Badge, Button, Calendar, Card, Carousel, Checkbox | Same-named components | Existing; Calendar is single-date and Carousel is manual |
| Breadcrumb | `Breadcrumbs` | Existing |
| Bubble, Message | `ChatBubble` | Basic author/time/message presentation; no streaming or rich message protocol |
| Button Group | `Join` + `Button` | Composition; label the group |
| Chart | `AssetMap`, `Progress`, `Stat` | Specialized graph/metrics only; no general chart system |
| Combobox | `Combobox`, `MultiSelect` | Existing searchable choices and field/validation contracts |
| Command | None | Gap: command palette, command registry and keyboard shortcuts |
| Context Menu | None | Gap: pointer/keyboard context menu; `Dropdown` does not substitute for this |
| Data Table | `DataTable` | Existing sorting, selection, pagination and resource states; no virtualization |
| Date Picker | `Calendar`, `DateRangePicker`, `Popover` | Composition for a single-date popover; range picker is native date inputs |
| Dialog | `Modal` | Existing native modal; new optional initial focus and dismissal controls |
| Direction | `LocaleProvider direction` | Existing scoped RTL/LTR and directional keyboard handling |
| Drawer, Sheet | `Drawer` | Left/right native modal panels; no draggable bottom sheet |
| Dropdown Menu | `Dropdown` | Existing flat action menu; no nested/checkable menu hierarchy |
| Empty | `ResourceState` | Existing empty/loading/error/retry composition |
| Field, Input, Input OTP, Label, Textarea | `Field`, `Input`, `OtpInput`, `Label`, `Textarea` | Existing native field contracts |
| Hover Card | None | Gap: rich hover/focus preview. Hydra's `HoverCard` is a decorative pointer tilt, not this pattern |
| Input Group | `Input leading/trailing`, `Field` | Existing adornments plus composition |
| Item | `List`, `Card` | Composition; application supplies item actions/semantics |
| Kbd | `Kbd` | Existing |
| Marker | `Indicator`, `Status` | Basic badge/status composition, not an annotation system |
| Menubar | None | Gap: menu-bar keyboard model; navigation `Menu` is not equivalent |
| Message Scroller | None | Gap: streaming, anchoring and scroll retention |
| Native Select | `Select` | Existing native select |
| Navigation Menu | `Menu`, `Navbar`, `MegaMenu` | Existing link/disclosure navigation; not the same advanced menu API |
| Pagination | `Pagination` | Existing bounded page navigation |
| Popover | `Popover` | Added: rich non-modal content, native top layer, focus and collision handling |
| Progress | `Progress`, `RadialProgress` | Existing |
| Questionnaire | None | Gap: multi-step branching and answer orchestration |
| Radio Group | `RadioGroup` | Existing native radios |
| Resizable | None | Gap: resizable panes and keyboard resize handles |
| Scroll Area | CSS overflow, table scrolling | Native composition; no custom scrollbar primitive |
| Select | `Select`, `Combobox` | Native selection/search alternatives; no identical custom select API |
| Separator | `Divider` | Existing |
| Sidebar | `Menu`, `Drawer`, showcase shell | Application composition; no public sidebar state provider |
| Skeleton | `Skeleton` | Existing |
| Slider | `RangeInput` | Existing single native range; no multi-thumb range |
| Spinner | `Loading` | Existing |
| Switch | `Switch` | Existing |
| Table, Tabs, Tooltip | Same-named components | Existing |
| Toast | `Snackbar`, `NotificationProvider`, `useNotifications` | Added scoped bounded queue; existing `Toast` remains supported |
| Toggle | `Swap` or `Button aria-pressed` | Existing toggle or application composition |
| Toggle Group | `Join` + pressed buttons | Composition only; no group selection or roving-focus primitive |
| Typography | Semantic HTML + tokens | Existing styling vocabulary; no dedicated typography exports |

Start application feedback at `/#components/feedback`. Retain the 68-family daisyUI
catalog as a separate inventory; it is not a count of complete shadcn compatibility.
Next priorities should follow a real product need: Command for large workspaces,
Context Menu/Menubar for desktop interaction, Resizable for analyst layouts, and a
separate optional chart package for analytical dashboards. Streaming chat patterns
need their own content, scroll and announcement contracts before inclusion.

The new dialogs and alerts follow the [WAI modal confirmation](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/)
and [alert guidance](https://www.w3.org/WAI/ARIA/apg/patterns/alert/). Automated
accessibility tests do not replace screen-reader and product-content review.
