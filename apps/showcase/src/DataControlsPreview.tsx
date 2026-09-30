import { useMemo, useState } from "react";
import {
  Badge, Button, Card, CardHeader, CardTitle, CardContent, CodeMockup,
  Combobox, MultiSelect, TagsInput, DateRangePicker, DataTable, Field, Input,
  Link, Checkbox, type DataColumn, type DataSorting,
} from "@hydra-security/ui";

type Asset = { id: string; host: string; risk: number; status: string };
const assets: Asset[] = Array.from({ length: 73 }, (_, i) => ({
  id: "asset-" + (i + 1), host: "asset-" + String(i + 1).padStart(3, "0") + ".example.com",
  risk: (i * 17) % 100, status: i % 3 === 0 ? "Review needed" : "Verified",
}));
const columns: DataColumn<Asset>[] = [
  { id: "host", header: "Asset", accessor: row => row.host, sortable: true, rowHeader: true },
  { id: "risk", header: "Risk score", accessor: row => row.risk, sortable: true, align: "end" },
  { id: "status", header: "Status", accessor: row => row.status },
];
const getId = (row: Asset) => row.id;
const teams = [
  { value: "platform", label: "Platform", description: "Infrastructure and services" },
  { value: "security", label: "Security", description: "Investigation and response" },
  { value: "archived", label: "Archived team", disabled: true },
  { value: "research", label: "Research", description: "Discovery and analysis" },
];
export default function DataControlsPreview() {
  const [submitted, setSubmitted] = useState(""), [query, setQuery] = useState("");
  const [page, setPage] = useState(1), [selected, setSelected] = useState<string[]>([]);
  const [remotePage, setRemotePage] = useState(1), [remoteSort, setRemoteSort] = useState<DataSorting | null>(null);
  const [loading, setLoading] = useState(false), [failed, setFailed] = useState(false);
  const filtered = useMemo(() => assets.filter(row => row.host.includes(query.toLowerCase())), [query]);
  // The demo owns the remote result. DataTable receives only this page.
  const remoteRows = useMemo(() => {
    const ordered = [...assets];
    if (remoteSort) ordered.sort((a, b) => {
      const column = columns.find(c => c.id === remoteSort.columnId)!;
      const left = column.accessor(a), right = column.accessor(b);
      const comparison = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right));
      return remoteSort.direction === "asc" ? comparison : -comparison;
    });
    return ordered.slice((remotePage - 1) * 5, remotePage * 5);
  }, [remotePage, remoteSort]);
  return <section className="foundations-preview" aria-labelledby="data-controls-title">
    <Link href="#components">← All components</Link>
    <div className="foundations-heading"><div><Badge severity="info">DATA CONTROLS</Badge>
      <h2 id="data-controls-title">From selection to investigation.</h2>
      <p>Search, compose filters and review records with the same Vitral controls.</p>
    </div></div>
    <div className="foundations-grid">
      <Card><CardHeader><CardTitle>Investigation settings</CardTitle></CardHeader><CardContent>
        <form className="foundations-form" aria-label="Investigation settings" onSubmit={event => {
          event.preventDefault(); const data = new FormData(event.currentTarget);
          setSubmitted(JSON.stringify({ team: data.get("team"), reviewers: data.getAll("reviewers"), tags: data.getAll("tags"),
            start: data.get("period.start"), end: data.get("period.end") }, null, 2));
        }}>
          <Field label="Owning team" required hint="Type to filter, then choose a team.">
            <Combobox name="team" options={teams} placeholder="Search teams" />
          </Field>
          <Field label="Reviewers" hint="Choose up to three teams.">
            <MultiSelect name="reviewers" options={teams} maxSelected={3} defaultValue={["security"]} placeholder="Add reviewers" />
          </Field>
          <Field label="Labels" hint="Enter or comma adds a tag. Paste multiple tags separated by commas.">
            <TagsInput name="tags" maxTags={5} defaultValue={["external"]} placeholder="Add a label"
              validateTag={tag => tag.length > 24 ? "Use 24 characters or fewer." : undefined} />
          </Field>
          <DateRangePicker label="Review period" name="period" required min="2026-01-01" max="2026-12-31"
            defaultValue={{ start: "2026-09-01", end: "2026-09-30" }} />
          <div className="foundation-actions"><Button type="submit">Review settings</Button><Button type="reset" variant="outline">Reset settings</Button></div>
        </form>
        {submitted && <CodeMockup language="json" caption="Submitted values" code={submitted} />}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Remote results</CardTitle></CardHeader><CardContent className="foundations-form">
        <p className="hydra-muted">The application supplies the current page and handles sorting requests.</p>
        <div className="foundation-actions">
          <Checkbox label="Simulate loading" checked={loading} onChange={event => setLoading(event.target.checked)} />
          <Checkbox label="Simulate error" checked={failed} onChange={event => setFailed(event.target.checked)} />
        </div>
        <DataTable mode="server" caption="Remote findings" rows={remoteRows} columns={columns} getRowId={getId}
          totalRows={assets.length} pageSize={5} page={remotePage} onPageChange={setRemotePage}
          sorting={remoteSort} onSortingChange={setRemoteSort} loading={loading}
          error={failed ? "The results could not be loaded." : undefined} onRetry={() => setFailed(false)} />
      </CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>Asset inventory</CardTitle></CardHeader><CardContent className="foundations-form">
      <Field label="Filter assets"><Input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="asset-001" /></Field>
      <DataTable caption="Asset inventory" rows={filtered} columns={columns} getRowId={getId} rowLabel={row => row.host}
        selectable selectedIds={selected} onSelectionChange={setSelected} page={page} onPageChange={setPage} pageSize={10}
        maxHeight="28rem" />
    </CardContent></Card>
    <CodeMockup language="tsx" caption="Use a server-owned page"
      code={'<DataTable mode="server" rows={response.rows} totalRows={response.total}\\n  columns={columns} getRowId={row => row.id} caption="Findings"\\n  page={page} onPageChange={setPage} pageSize={25}\\n  sorting={sorting} onSortingChange={setSorting} loading={loading} />'.replaceAll("\\n", "\n")} />
  </section>;
}
