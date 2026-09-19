# Hydra backend integration

Reviewed backend: [`Andres-Montoya-SV/hydra` at dc15beba](https://github.com/Andres-Montoya-SV/hydra/tree/dc15beba5b789a55f192f654cb00f8e27e6b1e26).
This is a source review and offline serializer integration, not a backend penetration
test or a claim that a deployed API exists.

## What exists today

Hydra is an argparse CLI (`app.py`) with a pipeline, SQLite `AssetStore`, report
generation and standalone verification/reportability/hypothesis workflows. Its
runtime dependencies are python-dotenv, rich and certifi. There is no HTTP application,
web authentication or tenant boundary in the reviewed application entry point.
Do not point a browser at SQLite or build a web endpoint that accepts arbitrary CLI
arguments, environment variables, shell strings or filesystem paths.

The existing `output/<run_id>/assets.json`, produced by `core/reporter.py` through
`AssetStore.export_run_json`, is the usable boundary for this change. The showcase's
**Hydra runs** screen reads that file locally. No scans, uploads, telemetry or
automatic requests to asset URLs are performed by the importer/viewer. Importing a
new file cancels the previous result; invalid files retain the previous snapshot.

## Reusable pieces

| Export | Purpose |
| --- | --- |
| `parseHydraExport(unknown)` | Zod validation and a typed projection of fields the UI consumes |
| `parseHydraExportJSON(text)` | JSON parsing with a 5 MiB UTF-8 size limit |
| `HydraExportImport` | File picker, loading, cancellation, validation errors and latest-selection-wins behavior |
| `HydraRunSummary` | Counts accurately labeled as historical records |
| `HydraHostInventory` | Search, risk/confidence filters, sorting, 20-row pages and selected-host details |
| `HydraHostDetails` | Sources, timestamps, DNS/tarpit/soft-404 caveats, findings, HTTP and port observations |
| `HydraRelationships` | Canonical relationship explanation, references, collection context and 20-row pages |
| `ResourceState` | Shared loading, empty and recoverable-error presentation |

The backend adapter and importer live at `@hydra-security/ui/hydra`. Generic UI
components remain at `@hydra-security/ui`. Types derive from the schema instead of
duplicating interfaces separately. The showcase loads the backend screen lazily.
Zod is the only new runtime dependency, exact-pinned with lockfile integrity; no
new global state store, HTTP wrapper, router or graph engine is required here.

```tsx
import {useState} from 'react';
import {HydraHostInventory, HydraRunSummary} from '@hydra-security/ui';
import {HydraExportImport, type HydraExport} from '@hydra-security/ui/hydra';

export function RunReview() {
  const [run, setRun] = useState<HydraExport | null>(null);
  return <>
    <HydraExportImport onImport={data => setRun(data)} />
    {run && <>
      <HydraRunSummary run={run} />
      <HydraHostInventory key={run.run_id} hosts={run.hosts} />
    </>}
  </>;
}
```

For a future API, pass decoded responses through `parseHydraExport` at the request
boundary and render its successful `data`. The exported components accept validated
types; they do not silently reparse every row on every render. Transport authentication,
response size limits, retries and cancellation belong to the consuming application.
Use `getExportWarnings(run)` alongside these components when presenting this legacy
export. The example screen demonstrates the full coverage warning.

## Contract mismatches this integration handles

| Actual backend behavior | Consequence for the app |
| --- | --- |
| `Host.to_dict()` emits at most 50 findings and 50 ports while counts retain the full totals | Show exported/total counts. Never label the visible rows a complete result set. |
| `export_run_json()` requests at most 500 relationships and catches exceptions by returning an empty relationship list | Coverage is always unknown. An empty list does not prove there are no relationships. |
| Export omits `verification_flags`, reportability decisions and finding database IDs | Findings remain observations requiring review. No confirm, dismiss, remediate or assignment action can be persisted from this file. |
| `core/reporter.py` applies verification filtering after writing `assets.json` | Raw assets may include claims excluded from the human report. Never bypass that distinction in the UI. |
| `alive_count` counts hosts with HTTP service records | It is not proof of present liveness, particularly with `dns_unconfirmed_http_response`. |
| Host confidence is lowercase; intelligence confidence bands are uppercase and use a different scale | Keep them separate; do not recalculate backend scores or treat confidence as severity. |
| Python timestamps can have offsets and microseconds; some fields can be missing as null/empty | Preserve original values and display missing dates as unknown, never as the current time. |
| Relationship scope/collection context is chosen from one endpoint by `serialize_relationship` | Do not grant collection permission or infer both endpoints' scope from it. |
| Certificate/IP/ASN entities may appear in relationships but are not all in `hosts` | Do not fabricate host records, ownership or map node kinds. Keep canonical entity identifiers. |
| No schema version is emitted | Adapter is pinned to a reviewed revision; versioned future exports must be reviewed before accepting them. |

Schemas reject invalid types, scores, dates, addresses, counts, duplicate host/
relationship identifiers and mixed-run relationships. Limits: 10,000 hosts, 500
relationships, 50 exported ports/findings per host, bounded strings/arrays. This is
a projection: unused graph/profile/header metadata is deliberately stripped, not
validated or advertised as usable. It does not establish the truth of scan results.
All observed URLs and artifact references are text, not navigation or downloads.
Large inventories should use backend pagination; a bigger client-side import limit
does not solve that problem.

## What the real web product still needs, in order

1. **A versioned, read-only API and stable identifiers.** Wrap the existing store and
   canonical serializers in one small service. Start with run lists, run details,
   paginated assets/findings/relationships and verification flags. Include run status,
   `schema_version`, totals, pagination and explicit completeness/error metadata.
   Give findings stable IDs. Keep this adapter as migration support, not the final API.
2. **Authentication and tenant authorization before exposing data.** Run IDs are not
   tenant IDs. Enforce access on every query and artifact download. UI hiding is not
   authorization; scope authorization for a target is also a different concept from
   a user's permission to read a customer's findings. Reuse a maintained identity
   provider rather than inventing password/token storage in this library.
3. **A durable job interface for scans.** Enqueue typed, allowlisted requests with
   idempotency, ownership and scope validation on the server. Workers reuse the
   current pipeline. Expose queued/running/partial/failed/cancelled/completed states;
   a failed collector must not make the whole UI show “no vulnerabilities.” Start
   with bounded polling; add SSE only when useful. Never execute scans in HTTP
   request handlers or let clients pick executable names/arbitrary arguments.
4. **A persisted analyst workflow.** Review contradictions, evidence and
   reportability; then assign owner, set status and record an audit trail. Backend
   rules remain authoritative. Hypotheses are suggestions, not vulnerabilities.
   LLM-assisted actions need explicit invocation and server-side budget limits.
5. **Monitoring and isolation tests.** Add run-to-run changes, schedules and
   notifications after the job model is stable. Test tenant isolation, API schema
   compatibility, retries/idempotency, partial results and one real browser journey.
   Store graph positions by tenant/user/map in the backend if cross-device behavior
   is required; localStorage only supports local preferences.

These are backend/product gaps, not features secretly implemented by this UI PR.
The existing target-collection authorization and evidence machinery should be reused,
not copied into TypeScript. A minimal service around that logic is safer and easier
to maintain than rewriting Hydra or building a generic workflow framework first.

## Verification and fixture provenance

`scripts/generate-hydra-fixture.py /path/to/hydra` uses the backend's actual
`Host.to_dict` and `serialize_relationship` with synthetic example.com / TEST-NET
data, without scanning. The outer envelope mirrors `export_run_json`; this is not
a captured production scan or an end-to-end database test. Regenerate using the
revision above when reviewing contract changes. Commit the resulting JSON fixture.

`npm run check` covers the contract, malformed payloads, export limits, XSS-safe text,
pagination, evidence labels, import races/cancellation and existing components.
Build exports include ESM, CJS and TypeScript declarations for both entry points.
Unit/DOM tests do not replace a deployed browser/API integration test.
