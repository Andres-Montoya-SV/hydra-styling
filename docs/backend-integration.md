# Hydra backend integration

Two backend states are documented here, because the source review that first
produced this file predates an HTTP API that now exists on `main`:

- **Legacy CLI + `assets.json` export**, reviewed at
  [`dc15beba`](https://github.com/Andres-Montoya-SV/hydra/tree/dc15beba5b789a55f192f654cb00f8e27e6b1e26).
  Covered in "What exists today" and "Contract mismatches" below. Still the correct
  reference for the historical-import flow this UI already ships.
- **The live HTTP API**, verified against `api/routers/*.py` and `api/tiers.py` on
  `main` at [`5025cda`](https://github.com/Andres-Montoya-SV/hydra/commit/5025cda6753fb82335e0ce2e371e2b500bd15451)
  (2026-09-19), reading the route decorators and gate logic directly rather than
  from a secondhand description. Covered in "Live HTTP API" below. Re-verify
  against that file's own docstrings before relying on any detail here — it moves
  faster than this doc will.

Everything under "What the real web product still needs, in order" has been
re-checked against that same revision and updated to say what is actually built
versus still a gap.

## What exists today (legacy CLI review, `dc15beba`)

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

This CLI-only picture is now out of date for anything besides the historical
import flow — see "Live HTTP API" below for what the deployed service actually does.

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

Scoped to the legacy `assets.json` export/importer only. None of these are
claims about the live HTTP API's `/scans/{scan_id}/report` or other JSON
responses, which have their own (undocumented-here) shapes — check
`api/schemas.py` before assuming any row below applies there too.

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

## Live HTTP API (verified against `api/routers/*.py`, `main@5025cda`)

A versioned service now exists and is worth building against for scans,
reportability, hypotheses and subscription management. `assets.json` import
remains the right tool for historical/offline runs — do not replace it, add
to it.

### Authentication is per-route, not uniform

Most routes depend on `require_api_key` (`api/auth.py`), which reads an
`X-API-Key` header, hashes and looks it up, and returns `401` if it's missing,
unknown, unverifiable or revoked/expired. **Three routes do not use it:**

| Route | Actual auth |
| --- | --- |
| `POST /accounts` | **None.** Intentionally unauthenticated right now — the router's own docstring flags this as a Round-1 gap ("must be removed or gated behind payment/tier logic before this service is exposed publicly"). Do not treat account creation as safe to expose from a public frontend as-is; confirm with backend before wiring a public sign-up flow to it. |
| `POST /webhooks/wompi` | `wompi_hash` header, HMAC-verified against the Wompi client secret. Never called by the frontend — Wompi calls it directly. |
| `GET/POST /admin/wompi/*` | `X-Admin-Token` header, compared to a server-side admin token. Not an account-scoped key; do not surface these two routes to normal account UI. |

Everything else below assumes a valid `X-API-Key`.

### Endpoints, with the response codes that actually matter to the UI

| Method | Route | Success | Notable non-2xx |
| --- | --- | --- | --- |
| POST | `/accounts` | 201, returns `api_key` once | — (unauthenticated, see above) |
| POST | `/keys/{key_id}/rotate` | 200, new key + `old_key_valid_until` grace deadline | 404 unknown/other-account key, 409 already revoked |
| POST | `/keys/{key_id}/revoke` | 204 | 404 unknown/other-account key |
| POST | `/domains` | 201, DNS + file verification instructions | — |
| POST | `/domains/{domain}/verify` | 200, `verified` | 404 no pending verification for this account/domain, 422 the real DNS/HTTP check failed (token still valid, retry), 409 domain already verified by a *different* account, 403 tier's verified-domain limit reached |
| POST | `/scans` | 202, `{scan_id, status: "queued"}` | 402 billing suspended past grace period, 403 scan-quota exceeded **or** domain not currently verified for this account |
| GET | `/scans/{scan_id}` | 200, one of `queued/running/completed/failed` | 404 if unknown **or** owned by a different account (never 403 — see below) |
| GET | `/scans/{scan_id}/report` | 200, `summary.json` contents | 404 not owned, 409 not completed yet |
| POST | `/scans/{scan_id}/client-report` | 200, `text/markdown` or the `.docx` media type | 403 format/language/white-label not allowed by tier, 404 not owned, 409 not completed |
| POST | `/scans/{scan_id}/reportability-estimate` | 200, cost + `estimate_id` | **404 if this account's tier is Free** (see gate note below), 404 scan not owned, 409 not completed, 402 estimate exceeds monthly LLM budget |
| POST | `/scans/{scan_id}/reportability-assessment` | 200, counts + actual cost | 400 missing `confirm: true` or invalid/expired/reused `estimate_id`, same 404 tier gate |
| POST | `/scans/{scan_id}/hypotheses-estimate` | 200, cost + `estimate_id` | **404 if tier is Free or Medium** — hypotheses is Pro/Ultra only, a stricter gate than reportability |
| POST | `/scans/{scan_id}/hypotheses-assessment` | 200, counts | 400 missing `confirm`/bad `estimate_id`, same tier gate |
| GET | `/account/subscription` | 200, tier/usage/limits | — |
| POST | `/account/subscription` | 200; paid tiers return a `payment_url` to redirect to, no immediate tier change | 422 missing `billing_email` for a paid tier, 503 that tier's payment link isn't configured on this deployment |
| POST | `/webhooks/wompi` | internal | not called by this app |
| GET/POST | `/admin/wompi/*` | internal | not called by this app |

### Gate behavior the UI must match exactly

- **Reportability and hypotheses are gated differently, not identically.**
  Free gets `404` on both. Medium gets `404` on hypotheses but a working
  reportability endpoint (single-provider, `auto_degrade` — see
  `degraded_from_adversarial` in the response). Pro/Ultra get both, with
  cross-validated adversarial checking. Don't show a single "upgrade to
  unlock AI features" gate for both — check `GET /account/subscription`'s
  `tier` and branch reportability/hypotheses availability separately.
- **A `404` here always means "acts like this route/resource doesn't exist
  for you,"** whether the cause is a tier gate, a missing scan, or a scan
  owned by someone else. `scans.py`'s own docstring is explicit that a
  `scan_id` belonging to another account returns 404, not 403, specifically
  so a non-owner can't distinguish "doesn't exist" from "exists but isn't
  yours." Don't build UI copy that assumes 404 always means "never existed."
- **`POST /scans` is the only route with a `403` that means something
  actionable**: not-verified vs. expired-verification vs. quota-exceeded are
  all 403 with different `detail` text — read the message rather than
  branching only on status code, since all three need different UI (start
  verification / re-verify / show quota+upgrade).
- **`-estimate` before `-assessment` is enforced server-side, not just a
  UI convention.** `-assessment` requires a live `estimate_id` from a prior
  `-estimate` call plus `confirm: true` in the body; it 400s otherwise. Still
  always call `-estimate` first and show the cost — don't rely on the server
  reject as your only guardrail against surprise spend.
- **Scan execution is an in-process background task, not a durable queue.**
  `POST /scans` returns 202 immediately; the actual ~25-minute scan runs as
  an `asyncio` task in the same process that accepted the request (the
  router's own comment calls this "this round's single-process scope").
  There is no evidence of persistence across a server restart or multi-worker
  execution. Poll `GET /scans/{scan_id}` for status as planned, but don't
  assume a `queued` scan survives a backend deploy — surface `failed` clearly
  and let the user re-request rather than implying the platform guarantees
  delivery.

## What the real web product still needs, in order

Items 1–3 below were written against the CLI-only `dc15beba` review and are now
**substantially built** — see "Live HTTP API" above for the actual routes and
caveats. They're kept here, marked, so the history of what was asked for versus
what shipped isn't lost; item 3 in particular shipped with a real limitation
worth tracking. Items 4–5 are still genuinely open.

1. ~~A versioned, read-only API and stable identifiers.~~ **Done, differently
   than proposed.** The shipped API is not a read-only wrapper around the
   existing store — it's a request/response service that also *drives* scans,
   domain verification, billing and LLM-gated features, with `scan_id`
   (`secrets.token_hex(16)`) as the stable identifier and per-tier 404/403/402
   semantics in place of a generic completeness envelope. There is still no
   `schema_version` field in any response; treat the endpoint table above as
   the pinned contract until one appears.
2. ~~Authentication and tenant authorization before exposing data.~~ **Done**
   for every account-scoped route via `X-API-Key` + `require_api_key`, with
   ownership re-checked per request (`get_owned_scan`, `get_key(key_id,
   account_id)`, etc.) rather than trusted from a prior lookup. The one
   remaining gap: `POST /accounts` itself is unauthenticated by design in the
   current round — flagged in-repo as needing to be gated before public
   exposure. Don't build a public sign-up UI against it without confirming
   that's been closed.
3. ~~A durable job interface for scans.~~ **Partially done.** Scans are
   enqueued with ownership/quota/verification checks before anything runs,
   and expose `queued/running/completed/failed` (no `partial`/`cancelled`).
   What's *not* there yet: durability. Execution is an in-process `asyncio`
   background task in the same process that accepted the request, not a
   worker pool or persisted job queue — a backend restart mid-scan has no
   documented recovery path. Bounded polling on `GET /scans/{scan_id}` still
   applies exactly as originally proposed.
4. **A persisted analyst workflow.** Still open. Reportability and hypotheses
   assessments return counts and outcomes per call, but there's no visible
   owner/status/audit-trail persistence layer beyond the estimate→assessment
   pairing and billing ledger. Hypotheses remain suggestions, not
   vulnerabilities; `-assessment` already requires explicit `confirm: true`
   plus a live `estimate_id`, so the "explicit invocation and server-side
   budget limits" requirement is met at the API layer — a workflow UI on top
   of it is still frontend-only work.
5. **Monitoring and isolation tests.** Still open. Nothing reviewed here
   covers run-to-run diffing, schedules, notifications, or automated tenant
   isolation/idempotency/retry tests. Store graph positions by tenant/user/map
   in the backend if cross-device behavior is required; localStorage only
   supports local preferences.

The `docs/PAID_API_DESIGN.md` file referenced throughout the router docstrings
in the hydra repo is the backend's own source of truth for this contract;
treat this section as a frontend-facing summary of it, not a replacement.

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
