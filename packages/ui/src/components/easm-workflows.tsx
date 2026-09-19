import { useState, type FormEvent } from "react";
import { Field, Input, Select, Textarea } from "./field";
import { Button } from "./button";
import { Badge } from "./badge";
import { Alert } from "./feedback";
import { ResourceState } from "./resource-state";

export type ScanJobStatus =
  | "queued"
  | "running"
  | "partial"
  | "failed"
  | "completed"
  | "cancelled";
export interface ScanJob {
  id: string;
  target: string;
  status: ScanJobStatus;
  startedAt?: string;
  message?: string;
}
/** The parent supplies authoritative job state. No fabricated progress percentages. */
export function ScanJobList({
  jobs,
  onCancel,
}: {
  jobs: ScanJob[];
  onCancel?: (id: string) => Promise<void>;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function cancel(id: string) {
    if (!onCancel || pending) return;
    setPending(id);
    setError("");
    try {
      await onCancel(id);
    } catch {
      setError(
        "The cancellation request failed. Refresh the job status before retrying.",
      );
    } finally {
      setPending(null);
    }
  }
  return (
    <section className="grid gap-3" aria-label="Scan jobs">
      <h3 className="font-display text-xl">Scan jobs</h3>
      {!jobs.length && (
        <ResourceState status="empty" message="No scan jobs available." />
      )}
      <ul className="divide-y divide-hydra-line">
        {jobs.map((job) => (
          <li
            key={job.id}
            className="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div>
              <strong className="break-all">{job.target}</strong>{" "}
              <Badge>{job.status}</Badge>
              <p className="text-sm text-hydra-muted">
                {job.message ??
                  (job.status === "partial"
                    ? "Some collectors did not complete. Review coverage."
                    : "")}
                {job.startedAt && ` · ${job.startedAt}`}
              </p>
            </div>
            {onCancel && ["queued", "running"].includes(job.status) && (
              <Button
                variant="secondary"
                disabled={pending !== null}
                onClick={() => void cancel(job.id)}
              >
                {pending === job.id
                  ? "Requesting cancellation…"
                  : "Request cancellation"}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {error && <Alert tone="danger">{error}</Alert>}
    </section>
  );
}

export type FindingDisposition =
  | "open"
  | "reviewing"
  | "resolved"
  | "false-positive"
  | "accepted-risk";
export interface FindingReview {
  findingId: string;
  status: FindingDisposition;
  assignee: string;
  note: string;
}
export function FindingReviewForm({
  value,
  onSave,
  readOnly = false,
}: {
  value: FindingReview;
  onSave: (review: FindingReview) => Promise<void>;
  readOnly?: boolean;
}) {
  return (
    <ReviewForm
      key={JSON.stringify(value)}
      value={value}
      onSave={onSave}
      readOnly={readOnly}
    />
  );
}
function ReviewForm({
  value,
  onSave,
  readOnly,
}: {
  value: FindingReview;
  onSave: (review: FindingReview) => Promise<void>;
  readOnly: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (readOnly || busy) return;
    setError("");
    setSaved(false);
    if (draft.status !== value.status && !draft.note.trim()) {
      setError("Explain the status change before saving.");
      return;
    }
    setBusy(true);
    try {
      await onSave({
        ...draft,
        assignee: draft.assignee.trim(),
        note: draft.note.trim(),
      });
      setSaved(true);
    } catch {
      setError("Review could not be saved. Your draft is preserved.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} aria-label="Finding review" className="grid gap-4">
      <h3 className="font-display text-xl">Finding review</h3>
      <p className="break-all text-sm text-hydra-muted">{value.findingId}</p>
      <fieldset disabled={readOnly || busy} className="grid gap-4">
        <Field label="Disposition">
          <Select
            value={draft.status}
            onChange={(e) => {
              setSaved(false);
              setDraft({
                ...draft,
                status: e.target.value as FindingDisposition,
              });
            }}
          >
            {[
              "open",
              "reviewing",
              "resolved",
              "false-positive",
              "accepted-risk",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label="Assignee UID">
          <Input
            maxLength={128}
            value={draft.assignee}
            onChange={(e) => {
              setSaved(false);
              setDraft({ ...draft, assignee: e.target.value });
            }}
          />
        </Field>
        <Field label="Review note">
          <Textarea
            maxLength={4000}
            value={draft.note}
            onChange={(e) => {
              setSaved(false);
              setDraft({ ...draft, note: e.target.value });
            }}
          />
        </Field>
        <Button type="submit">Save review</Button>
      </fieldset>
      {error && <Alert tone="danger">{error}</Alert>}
      {saved && <Alert tone="success">Review saved.</Alert>}
    </form>
  );
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  target: string;
  occurredAt: string;
}
export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  return (
    <section aria-label="Audit trail">
      <h3 className="mb-4 font-display text-xl">Audit trail</h3>
      {!events.length ? (
        <ResourceState status="empty" message="No audit events available." />
      ) : (
        <ol className="grid gap-4 border-l border-hydra-line pl-5">
          {events.map((event) => (
            <li key={event.id}>
              <p className="break-words">
                <strong>{event.actor}</strong> · {event.action} · {event.target}
              </p>
              <time
                dateTime={event.occurredAt}
                className="text-xs text-hydra-muted"
              >
                {event.occurredAt}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function ScopeSummary({
  included,
  excluded,
  policyVersion,
}: {
  included: string[];
  excluded: string[];
  policyVersion: string;
}) {
  return (
    <section aria-label="Authorized scope" className="grid gap-4">
      <h3 className="font-display text-xl">Scope policy</h3>
      <p className="text-sm text-hydra-muted">
        Version {policyVersion}. The backend must authorize every collection
        request.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="font-semibold">Included</h4>
          <ul className="break-all">
            {included.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {!included.length && <p>No included targets.</p>}
        </div>
        <div>
          <h4 className="font-semibold">Excluded</h4>
          <ul className="break-all">
            {excluded.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {!excluded.length && <p>No exclusions supplied.</p>}
        </div>
      </div>
    </section>
  );
}
