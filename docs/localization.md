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

English and Spanish dictionaries cover **component-owned text in the base catalog
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
its own overrides. `useHydraLocale`, `enMessages` and `esMessages` are public.

Direction is inferred for Arabic, Persian, Hebrew and Urdu, and can be explicitly
set to `ltr` or `rtl`. Tab/calendar horizontal arrow keys, pagination arrows,
carousel arrows and floating alignment follow direction. Arrow Up/Down and
Home/End retain their logical meaning. The showcase can preview RTL with Spanish
to inspect layout independently of translation. No Arabic dictionary is included.

Visit `/#components/consistency` for live locale, direction, density and state
controls, or change language/density on an individual catalog detail page.
