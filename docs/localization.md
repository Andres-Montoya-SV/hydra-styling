# Scoped localization

```tsx
import { LocaleProvider, DensityProvider, ThemeProvider } from "@hydra-security/ui";

<LocaleProvider locale="es-SV" messages={{ retry: "Volver a intentar" }}>
  <ThemeProvider defaultTheme="nocturne">
    <DensityProvider density="comfortable"><App /></DensityProvider>
  </ThemeProvider>
</LocaleProvider>
```

`LocaleProvider` sets `lang` and `dir` on its own scope. It does not mutate the
document, read the browser language, or use storage, so server and client render
the same initial tree. Use a valid BCP 47 locale. The default is `en-US`.

English, Spanish and Brazilian Portuguese dictionaries cover **component-owned text in the base catalog
and data controls**: buttons, password visibility, calendars, menus, pagination,
overlays, galleries, validation, table summaries and shared recovery states.
`Calendar` formats dates with the selected locale and UTC; its week starts on
Sunday. `DataTable` uses the locale for collation. ISO date values and form keys
never change with the display language.

Application titles, option values/labels, column headers, user data, custom
validation errors and the specialized Hydra/Firebase workflow copy are not
automatically translated. Those remain application content; this provider is a
base component dictionary, not a translation service for an entire product.

Explicit component labels override the provider. `messages` is a typed partial
`HydraMessages`; English fallback applies to unsupported languages. Parameterized
labels are functions, so applications can use their own pluralization and number
formatting without string concatenation at each call site:

```tsx
<LocaleProvider locale="es-SV" messages={{
  remove: label => `Eliminar ${label}`,
  tableSummary: (page, pages, records, selected) =>
    `Página ${page}/${pages} · ${records} activos · ${selected} seleccionados`,
}}><Inventory /></LocaleProvider>
```

A nested provider without `locale` inherits its parent's messages and overrides.
Changing `locale` resets that scope to the chosen language dictionary, then applies
its own overrides. `useHydraLocale`, `enMessages`, `esMessages` and `ptBRMessages` are public.

Direction is inferred for Arabic, Persian, Hebrew and Urdu, and can be explicitly
set to `ltr` or `rtl`. Tab/calendar horizontal arrow keys, pagination arrows,
carousel arrows and floating alignment follow direction. Arrow Up/Down and
Home/End retain their logical meaning. The showcase can preview RTL with Spanish
to inspect layout independently of translation. No Arabic dictionary is included.

Visit `/#components/consistency` for live locale, direction, density and state
controls, or change language/density on an individual catalog detail page.

## Showcase static copy

The site language selector supports English (`en-US`), Spanish (`es-SV`) and
Brazilian Portuguese (`pt-BR`). Its application-level preference is persisted in
`hydra:locale`; unavailable storage falls back to the current session. The showcase
owns document `lang`; the library provider still changes only its local scope.
Catalog and consistency previews inherit the site language unless explicitly
changed. Language changes retain entered values and stable option/route IDs.

Translated scope: shell navigation and controls, catalog introduction, all 68
catalog descriptions/categories/search, API table chrome, consistency demo and the
new feedback demo. Component-owned base labels use the three complete dictionaries.
Specialized Hydra/Firebase workflows, other demo records, source documentation,
TypeScript identifiers and code examples remain in their authored language. This
is an explicit static dictionary, not automatic translation of arbitrary content.
Notifications translate built-in controls live; caller-supplied messages retain the
text supplied at emission unless updated by the application.

`showcase-translations.ts` stores Spanish/Brazilian Portuguese pairs keyed by
English source copy; interpolation inserts data as React text, never HTML. The
`docs:check` gate verifies both languages, matching placeholders, referenced static
keys and every catalog description. Add translated copy through this dictionary;
never translate DOM text globally or mutate stored business values.
