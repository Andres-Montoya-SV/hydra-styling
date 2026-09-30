# Data controls

The live workspace is `/#components/data-controls`. All five controls use Vitral
tokens, the shared density scope and the native form contracts from
[application foundations](foundations.md).

| Component | Value | Native form output | Interaction |
| --- | --- | --- | --- |
| `Combobox` | option key | `name=value` | Type to filter; arrows navigate enabled results; Enter commits; Escape discards the query |
| `MultiSelect` | option keys | repeated `name=value` | Same keyboard model; selected chips have named removal buttons; optional selection limit |
| `TagsInput` | strings | repeated `name=value` | Enter/comma commits; comma/newline paste deduplicates; Backspace on an empty editor removes the last tag |
| `DateRangePicker` | `{ start, end }` ISO dates | `name.start`, `name.end` | Native date inputs plus bounded calendars; an inverted range remains editable but fails validation |
| `DataTable<T>` | rows and independent sort/page/selection state | no form submission | Native table semantics, sortable headers, page selection, local or remote pagination |

## Form contracts

Use `value`/`onValueChange` for application-controlled fields, or `defaultValue`
for native form/reset behavior. Controlled fields stay owned by the application
after reset. `Combobox`, `MultiSelect` and `TagsInput` compose with `Field` (or
their own `label`) and forward the native editor ref. An uncommitted search query
is never submitted as a selection. Required selections use native validity;
`disabled` values are excluded from `FormData`, while read-only values are retained.
`DateRangePicker` owns a labelled fieldset and forwards its ref.

```tsx
<Field label="Team" required hint="Choose an authorized team">
  <Combobox name="team" options={teams} />
</Field>
<MultiSelect label="Reviewers" name="reviewer" options={teams} maxSelected={3} />
<TagsInput label="Labels" name="tag" maxTags={5}
  validateTag={tag => tag.length > 24 ? "Use at most 24 characters" : undefined} />
<DateRangePicker label="Period" name="period" required
  min="2026-01-01" max="2026-12-31" />
```

Selections should refer to keys in the supplied options. For asynchronous option
loading, pass `loading` and update the options in the parent. Search is local to
the supplied options; network fetching, cancellation and authorization belong to
the application. Empty/loading states and removal/validation labels are overridable.
Tag validation rejects a whole candidate, preserves rejected input for correction,
and blocks submission until the error is corrected. IME composition is preserved.

## Table ownership

Columns declare a stable `id`, a header and a sortable scalar `accessor`; an optional
`cell` renders richer content without changing the sort value. `getRowId` must
return unique, non-empty stable IDs. Rows are never mutated.

Client mode sorts with `Intl.Collator` (or numeric comparison), then slices a
bounded page (`pageSize` defaults to 25, maximum 500). Server mode **never sorts or
slices** the supplied rows: give it only the fetched page and `totalRows`.

```tsx
<DataTable mode="server" caption="Findings" rows={response.rows}
  columns={columns} getRowId={row => row.id} totalRows={response.total}
  page={page} onPageChange={setPage} pageSize={25}
  sorting={sort} onSortingChange={setSort}
  selectable selectedIds={selected} onSelectionChange={setSelected}
  loading={pending} error={error} onRetry={reload} />
```

Sorting requests page 1. Selection survives sorting, filtering and paging; the
header checkbox selects only eligible rows on the current page and exposes mixed
state. Remove stale selected IDs when records are deleted in your application.
Loading retains existing rows but disables interactions; errors hide stale rows
and expose recovery. Empty results, loading and counts have live status text.

This is a paginated native table, not a virtualized grid or spreadsheet. Server
requests, cache invalidation, debouncing and export remain application concerns.
Labels, summaries and locale are public props; column content is application-owned.

## Verification

Unit tests cover controlled/reset behavior, native validity/FormData, disabled and
read-only states, IME, limits, numeric sorting, immutable rows and remote ownership.
`data-controls.spec.ts` exercises real focus, selection, validation, recovery,
pagination and axe in Chromium (desktop/mobile), Firefox and WebKit.
