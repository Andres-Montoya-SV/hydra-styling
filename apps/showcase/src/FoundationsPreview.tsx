import { useState } from "react";
import {
  Badge, Button, Card, CardContent, CardHeader, CardTitle, CodeMockup,
  DensityProvider, Dropdown, Field, Input, Link, Modal, PasswordInput,
  Select, Table, Textarea, Tooltip, type ControlSize, type HydraDensity,
} from "@hydra-security/ui";

export default function FoundationsPreview() {
  const [density, setDensity] = useState<HydraDensity>("comfortable");
  const [saving, setSaving] = useState(false), [open, setOpen] = useState(false);
  const [message, setMessage] = useState("Ready to review.");
  const actions = [
    { id: "copy", label: "Copy scope", onSelect: () => setMessage("Scope copied in this preview.") },
    { id: "restricted", label: "Restricted action", disabled: true, onSelect: () => {} },
    { id: "review", label: "Review evidence", onSelect: () => setMessage("Evidence selected.") },
  ];
  return (
    <section className="foundations-preview" aria-labelledby="foundations-title">
      <Link href="#components">← All components</Link>
      <div className="foundations-heading">
        <div><Badge severity="info">APPLICATION FOUNDATIONS</Badge>
          <h2 id="foundations-title">One rhythm, across the workspace.</h2>
          <p>Compare control sizes, compose a form and explore menus inside constrained surfaces.</p>
        </div>
        <Field label="Workspace density" controlId="foundation-density">
          <Select value={density} onChange={e => setDensity(e.target.value as HydraDensity)}>
            <option value="comfortable">Comfortable</option><option value="compact">Compact</option>
          </Select>
        </Field>
      </div>
      <DensityProvider density={density} data-testid="foundation-density-scope">
        <div className="foundations-grid">
          <Card><CardHeader><CardTitle>Aligned controls</CardTitle></CardHeader>
            <CardContent className="foundations-sizes">
              {(["sm", "md", "lg"] as ControlSize[]).map(size => (
                <div className="foundation-size-row" data-size-row={size} key={size}>
                  <Field label={"Target — " + size} controlSize={size}><Input placeholder="example.com" /></Field>
                  <Field label={"Type — " + size} controlSize={size}><Select><option>Domain</option><option>Address</option></Select></Field>
                  <Button size={size}>Inspect</Button>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card><CardHeader><CardTitle>Connected form states</CardTitle></CardHeader>
            <CardContent>
              <form className="foundations-form" onSubmit={e => { e.preventDefault(); setSaving(true); }}>
                <Field label="Authorized domain" hint="Use a hostname without a protocol."
                  error="This preview shows a validation message.">
                  <Input id="foundation-domain" name="domain" defaultValue="example.com"
                    aria-describedby="foundation-policy" />
                </Field>
                <p id="foundation-policy" className="hydra-muted">Only approved assets belong in scope.</p>
                <Field label="Workspace ID" readOnly><Input name="workspace" defaultValue="hydra-demo" /></Field>
                <Field label="Access token" controlSize="sm"><PasswordInput name="token" defaultValue="demo-token" /></Field>
                <Field label="Notes" optional><Textarea name="notes" placeholder="Context for your team" /></Field>
                <div className="foundation-actions">
                  <Button type="submit" loading={saving} loadingLabel="Saving configuration">Save configuration</Button>
                  <Button variant="outline" disabled={!saving} onClick={() => { setSaving(false); setMessage("Configuration saved in this preview."); }}>Finish preview</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <Card><CardHeader><CardTitle>Floating actions</CardTitle></CardHeader>
            <CardContent className="foundations-form">
              <p className="hydra-muted">Open the menu at the edge of this clipped surface.</p>
              <div className="foundation-clip" data-testid="foundation-clip">
                <Dropdown label="Workspace actions" items={actions} />
              </div>
              <div className="foundation-actions">
                <Tooltip content="Review which domains your organization has approved.">
                  <Button variant="outline">Scope help</Button>
                </Tooltip>
                <Button onClick={() => setOpen(true)}>Inspect in dialog</Button>
              </div>
            </CardContent>
          </Card>
          <Card><CardHeader><CardTitle>Density follows the content</CardTitle></CardHeader>
            <CardContent>
              <Table><caption>Sample assets</caption>
                <thead><tr><th scope="col">Asset</th><th scope="col">Status</th></tr></thead>
                <tbody><tr><th scope="row">example.com</th><td>Reviewed</td></tr>
                  <tr><th scope="row">api.example.com</th><td>Pending</td></tr></tbody>
              </Table>
              <DensityProvider density="comfortable" className="foundation-nested">
                <Field label="Comfortable override"><Input placeholder="This section keeps its own density" /></Field>
              </DensityProvider>
            </CardContent>
          </Card>
        </div>
        <Modal open={open} onOpenChange={setOpen} title="Workspace review"
          description="Actions stay within the theme and above the dialog surface.">
          <div className="foundation-clip">
            <Dropdown label="Dialog actions" items={actions} />
          </div>
          <div className="foundation-actions">
            <Tooltip content="This help remains readable inside the dialog."><Button variant="outline">Dialog help</Button></Tooltip>
            <Button variant="outline" onClick={() => setOpen(false)}>Done</Button>
          </div>
        </Modal>
      </DensityProvider>
      <p role="status" className="hydra-muted">{message}</p>
      <CodeMockup language="tsx" caption="Compose a workspace"
        code={'<DensityProvider density="compact">\n  <Field label="Domain" controlId="domain" hint="Approved hostnames only">\n    <Input name="domain" controlSize="md" />\n  </Field>\n  <Button loading={saving} loadingLabel="Saving scope">Save scope</Button>\n</DensityProvider>'} />
    </section>
  );
}
