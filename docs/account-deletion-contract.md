# Account deletion contract

The UI package supplies reauthentication, confirmation and an HTTP client. It does **not** supply or deploy the privileged cleanup service. Until that service exists, keep `VITE_ACCOUNT_DELETE_URL` empty; the form stays disabled.

## Request and result

`DELETE https://your-api.example/account` with `Authorization: Bearer <fresh Firebase ID token>`. No UID, organization, password or token in the URL/body. Configure CORS for your actual frontend origin and allow DELETE and Authorization. Never redirect this request. HTTPS is mandatory except for explicitly enabled local development.

| Status | Meaning | Client behavior |
| --- | --- | --- |
| 204 | All required cleanup and Auth deletion completed | Resolve, then sign out locally |
| 401 | Missing, invalid, revoked or stale authentication | Remain signed in; require authentication again |
| 403 | Policy denies deletion | Remain signed in; show a safe error |
| 409 | Organization ownership or retention policy blocks deletion | Resolve ownership/retention first |
| 429 | Rate limit | Retry later |
| 5xx / network failure | Completion not confirmed | Do not claim success |
| 200 / 202 | Not this contract; queued work is not completion | Reject |

`requestAccountDeletion` has a 30-second timeout and supports cancellation. A timeout does not undo server work. The server must make retries safe and must never return 204 for merely queued cleanup. If cleanup requires a long-running job, implement a separate status protocol before enabling this form.

## Required server behavior

1. Verify Firebase token signature, issuer, audience, expiry and revocation with the Admin SDK. Derive UID from the verified token. Require `auth_time` within five minutes; minting a fresh token alone does not mean recent authentication.
2. Authorize deletion against current server-side organization ownership and retention policy. Reject sole-owner deletion until ownership is transferred through a separately authorized operation. The library currently has no ownership-transfer UI.
3. Create a durable, idempotent deletion record keyed by UID; block concurrent profile, membership and file mutations for the deleting identity. A database-only flag is insufficient unless every relevant rule/API honors it. The rules shipped here do not yet implement this backend-specific deletion state.
4. Inventory all memberships and stored objects with pagination. Apply the organization's evidence-retention policy; never delete another tenant's data based on a browser-supplied path. Clean up personal data, indexes and associated backend records. A username is a display identifier, not an authorization key.
5. Delete Firebase Auth only after required cleanup completes. Record minimal audit metadata without passwords, bearer tokens or unnecessary personal data. Handle partial failures through a durable retry worker; do not return success while work remains.
6. Return 204 with no response body. Keep client-facing errors generic. Repeated requests after Auth deletion need a documented server recovery mechanism; do not weaken token verification just to make retries convenient.

Backend acceptance tests must cover cross-user attempts, stale/revoked tokens, sole-owner protection, retained evidence, partial failures, concurrent uploads, duplicate requests and more than one page of objects. This repo tests client HTTP semantics and reauthentication, **not** those unimplemented server guarantees.

## Consumer wiring

```tsx
<DeleteAccountForm onDeleteAccount={async token => {
  await requestAccountDeletion('https://your-api.example/account', token);
  await signOut(services.auth);
}} />
```

Replace the placeholder with your absolute HTTPS endpoint. Never put service-account credentials in Vite environment variables.
