import { useEffect, useId, useMemo, useRef, type ReactNode } from "react";
import { Button } from "./button";
import { Pagination } from "./catalog-navigation";
import { useControllable } from "./catalog-shared";

export interface DataSorting { columnId: string; direction: "asc" | "desc" }
export interface DataColumn<T> {
  id: string;
  header: ReactNode;
  accessor: (row: T) => string | number | null | undefined;
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  sortLabel?: string;
  align?: "start" | "end";
  rowHeader?: boolean;
}
interface TableBase<T> {
  rows: T[];
  columns: DataColumn<T>[];
  getRowId: (row: T) => string;
  caption: string;
  locale?: string;
  sorting?: DataSorting | null;
  defaultSorting?: DataSorting | null;
  onSortingChange?: (sorting: DataSorting | null) => void;
  page?: number;
  defaultPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  selectable?: boolean;
  selectedIds?: string[];
  defaultSelectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  isRowSelectable?: (row: T) => boolean;
  rowLabel?: (row: T) => string;
  loading?: boolean;
  error?: ReactNode;
  onRetry?: () => void;
  emptyMessage?: ReactNode;
  loadingMessage?: string;
  retryLabel?: string;
  selectPageLabel?: string;
  selectRowLabel?: (label: string) => string;
  summaryLabel?: (page: number, totalPages: number, totalRows: number, selected: number) => string;
  maxHeight?: number | string;
  className?: string;
}
export type DataTableProps<T> = TableBase<T> & (
  { mode?: "client"; totalRows?: never } | { mode: "server"; totalRows: number }
);
function PageCheckbox({ checked, mixed, disabled, label, onChange }: {
  checked: boolean; mixed: boolean; disabled: boolean; label: string; onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = mixed; }, [mixed]);
  return <input ref={ref} type="checkbox" checked={checked} disabled={disabled} aria-label={label} onChange={onChange} />;
}
/** A native table with bounded pages. Server mode never sorts or slices caller rows. */
export function DataTable<T>({
  rows, columns, getRowId, caption, locale, mode = "client", totalRows,
  sorting, defaultSorting = null, onSortingChange, page, defaultPage = 1, pageSize = 25, onPageChange,
  selectable = false, selectedIds, defaultSelectedIds = [], onSelectionChange, isRowSelectable = () => true,
  rowLabel = getRowId, loading = false, error, onRetry, emptyMessage = "No matching records.",
  loadingMessage = "Loading records", retryLabel = "Try again", selectPageLabel = "Select this page",
  selectRowLabel = label => "Select " + label,
  summaryLabel = (current, pages, count, selected) => "Page " + current + " of " + pages + " · " + count + " records · " + selected + " selected",
  maxHeight, className,
}: DataTableProps<T>) {
  const [sort, setSort] = useControllable(sorting, defaultSorting, onSortingChange);
  const [current, setPage] = useControllable(page, defaultPage, onPageChange);
  const [selection, setSelection] = useControllable(selectedIds, defaultSelectedIds, onSelectionChange);
  const id = useId(), size = Math.max(1, Math.min(500, Math.floor(pageSize) || 25));
  const count = mode === "server" ? Math.max(0, totalRows ?? 0) : rows.length;
  const pages = Math.max(1, Math.ceil(count / size)), displayedPage = Math.max(1, Math.min(pages, Math.floor(current) || 1));
  const collator = useMemo(() => new Intl.Collator(locale, { numeric: true, sensitivity: "base" }), [locale]);
  const ordered = useMemo(() => {
    const ids = rows.map(getRowId);
    if (ids.some(value => !value) || new Set(ids).size !== ids.length) throw new Error("DataTable requires a unique, non-empty ID for each row.");
    const column = columns.find(column => column.id === sort?.columnId && column.sortable);
    if (mode === "server" || !sort || !column) return rows;
    return rows.map((row, index) => ({ row, index })).sort((a, b) => {
      const left = column.accessor(a.row), right = column.accessor(b.row);
      if (left == null || right == null) return left == null && right == null ? a.index - b.index : left == null ? 1 : -1;
      const result = typeof left === "number" && typeof right === "number" ? left - right : collator.compare(String(left), String(right));
      return (sort.direction === "asc" ? result : -result) || a.index - b.index;
    }).map(item => item.row);
  }, [rows, columns, sort, mode, getRowId, collator]);
  const visible = mode === "server" ? ordered : ordered.slice((displayedPage - 1) * size, displayedPage * size);
  const selectableRows = visible.filter(isRowSelectable).map(getRowId);
  const selected = new Set(selection), allSelected = selectableRows.length > 0 && selectableRows.every(id => selected.has(id));
  const mixed = !allSelected && selectableRows.some(id => selected.has(id));
  const colspan = columns.length + (selectable ? 1 : 0);
  function togglePage() {
    const next = new Set(selection);
    for (const id of selectableRows) { if (allSelected) next.delete(id); else next.add(id); }
    setSelection([...next]);
  }
  return <section role="group" className={"hydra-data-table " + (className ?? "")} aria-label={caption} aria-busy={loading}>
    {error && <div role="alert" className="hydra-data-error">{error}{onRetry && <Button variant="outline" size="sm" onClick={onRetry} disabled={loading}>{retryLabel}</Button>}</div>}
    <div className="hydra-data-table-scroll" role="region" aria-labelledby={id} tabIndex={0} style={{ maxHeight }}>
      <table className="hydra-table">
        <caption id={id}>{caption}</caption>
        <thead><tr>
          {selectable && <th scope="col"><PageCheckbox checked={allSelected} mixed={mixed}
            disabled={loading || Boolean(error) || selectableRows.length === 0} label={selectPageLabel} onChange={togglePage} /></th>}
          {columns.map(column => <th key={column.id} scope="col" style={{ textAlign: column.align }}
            aria-sort={column.sortable ? sort?.columnId === column.id ? sort.direction === "asc" ? "ascending" : "descending" : "none" : undefined}>
            {column.sortable ? <button type="button" disabled={loading} aria-label={column.sortLabel}
              onClick={() => {
                setSort({ columnId: column.id, direction: sort?.columnId === column.id && sort.direction === "asc" ? "desc" : "asc" });
                setPage(1);
              }}>{column.header}<span aria-hidden="true">{sort?.columnId === column.id ? sort.direction === "asc" ? " ↑" : " ↓" : " ↕"}</span></button> : column.header}
          </th>)}
        </tr></thead>
        <tbody>{!error && visible.map(row => {
          const rowId = getRowId(row);
          return <tr key={rowId} data-selected={selected.has(rowId) || undefined}>
            {selectable && <td><input type="checkbox" aria-label={selectRowLabel(rowLabel(row))} checked={selected.has(rowId)}
              disabled={loading || !isRowSelectable(row)} onChange={() => setSelection(selected.has(rowId) ? selection.filter(id => id !== rowId) : [...selection, rowId])} /></td>}
            {columns.map(column => {
              const content = column.cell ? column.cell(row) : column.accessor(row) ?? "—";
              return column.rowHeader ? <th key={column.id} scope="row" style={{ textAlign: column.align }}>{content}</th> :
                <td key={column.id} style={{ textAlign: column.align }}>{content}</td>;
            })}
          </tr>;
        })}
          {(error || !visible.length) && <tr><td colSpan={colspan}>{error ? "—" : loading ? loadingMessage : emptyMessage}</td></tr>}
        </tbody>
      </table>
    </div>
    <div className="hydra-data-table-footer">
      <p role="status">{loading ? loadingMessage : summaryLabel(displayedPage, pages, count, selection.length)}</p>
      <fieldset disabled={loading || Boolean(error)}><Pagination page={displayedPage} totalPages={pages} onPageChange={setPage} label={caption + " pages"} /></fieldset>
    </div>
  </section>;
}
