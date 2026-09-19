# Hydra application toolkit

The `@hydra-security/ui/firebase` entry point provides Firebase Auth, private
profiles, organization membership and organization-shared evidence files. The
main UI entry point stays independent of Firebase initialization. This is an
application foundation; Hydra's scan worker still needs a trusted API.

## Start an application

Until this version is published, build and install its local tarball:

```sh
# In hydra-styling (Node 24; Java 21 for rule tests)
npm ci --ignore-scripts
npm run build
npm pack -w @hydra-security/ui
mkdir ../hydra-app
cp -R packages/ui/starter/. ../hydra-app/
cd ../hydra-app
npm install --ignore-scripts ../hydra-styling/hydra-security-ui-0.1.0.tgz
cp firebase.env.example .env.local
cp gitignore.example .gitignore
# Fill the public Firebase configuration in .env.local before starting.
npm run dev
```

After publishing, install `@hydra-security/ui` normally and copy its `starter`
directory to an empty application directory. Commit the application's own lockfile.
The starter uses session-scoped Auth persistence and deliberately avoids persistent
Firestore caching of customer data. The Firebase SDK is a regular dependency;
the CLI and rule-test libraries are development tools, not shipped runtime code.

## Configure your Firebase project

1. Register a web application and copy its public web configuration into the
   starter's `.env.local`. Never put a service-account key or Admin SDK credential
   in a `VITE_*` variable. Client configuration is public, not authorization.
2. Enable email/password Authentication. Configure authorized domains, email
   templates, email-enumeration protection and a server-enforced password policy.
   Forms use a 12-character minimum; configure Firebase's policy accordingly.
3. Provision the default Firestore database and a Cloud Storage bucket. Check
   Firebase's billing requirements, select the intended region and configure
   budgets/quotas before using a production project.
4. Review the supplied rules, indexes and role model, then deploy to your explicit
   project from the starter directory with a reviewed Firebase CLI installation:

   ```sh
   firebase deploy --project YOUR_PROJECT_ID --only firestore:rules,firestore:indexes,storage
   ```

   This is a manual deployment command, never an install hook. Storage rules read
   Firestore membership; enable the cross-service permission requested by Firebase
   when deploying. Do not start with test-mode/public rules.
5. Configure your bucket's CORS policy for authenticated browser downloads using
   `getBlob`. Replace the example origin in `cors.example.json` with your actual
   app origin and apply it with your cloud administration tooling. Add localhost
   only to a development bucket; do not use a wildcard origin.
6. Deploy your frontend over HTTPS. Review account recovery, retention, quotas,
   abuse protection and App Check enforcement before inviting customers. App Check
   is not initialized by this library and does not replace authorization.

See official documentation for [Auth password policies](https://firebase.google.com/docs/auth/web/password-auth),
[Storage cross-service rules](https://firebase.google.com/docs/storage/security/rules-conditions#enhance_with_firestore),
[browser downloads and CORS](https://firebase.google.com/docs/storage/web/download-files#cors_configuration),
and [App Check](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider).

## Compose access boundaries

React component names must start with a capital letter: use `<Protected>`, not
`<protected>`. Initialize services once in the browser application's entry point:

```tsx
import '@hydra-security/ui/styles.css';
import {
  initializeHydraFirebase, FirebaseProvider, Protected, PublicOnly,
  AuthForm, OrganizationProvider, RequireOrganization, OrganizationFiles,
} from '@hydra-security/ui/firebase';

const services = initializeHydraFirebase(firebaseWebConfig);

export function App({selectedOrganizationId}: {selectedOrganizationId: string}) {
  return (
    <FirebaseProvider services={services}>
      <PublicOnly><AuthForm mode="sign-in" /></PublicOnly>
      <Protected requireVerifiedEmail fallback={<p>Sign in and verify your email.</p>}>
        <OrganizationProvider orgId={selectedOrganizationId}>
          <RequireOrganization>
            <OrganizationFiles />
          </RequireOrganization>
          <RequireOrganization roles={['owner', 'admin']} fallback={null}>
            <YourAdministrationScreen />
          </RequireOrganization>
        </OrganizationProvider>
      </Protected>
    </FirebaseProvider>
  );
}
```

Guards wait for Auth/membership resolution and fail closed on lookup errors. They
control rendering; Firestore/Storage rules enforce access even if someone bypasses
React. A separate Hydra API must verify Firebase ID tokens and active organization
membership for **every request**. Never trust a client-supplied UID, org ID or role.
The Firebase Admin SDK bypasses these rules and requires its own server checks.

## Components and persisted data

| Component | Behavior |
| --- | --- |
| `AuthForm` | Sign in, sign up, or reset password through Firebase Auth |
| `EmailVerificationPanel` | Send verification and refresh the verified session |
| `ProfileForm` | Private display name and username, with read-only account email |
| `ChangePasswordForm` | Reauthenticate with current password before changing it |
| `SignOutButton` | End the Firebase session |
| `OrganizationPicker` | Select membership or atomically create an organization and owner |
| `OrganizationMembers` | Owner grants roles/suspends an existing account UID |
| `OrganizationFiles` | Upload with progress/cancel, list 20 per page, download and confirm deletion |

Profiles live at `users/{uid}`. Only their owner can read/write the allowed
fields; passwords remain in Firebase Auth and are never stored in profile documents.
The username is a display handle, **not a unique login identifier**. Changing email,
MFA and SSO are not implemented. `DeleteAccountForm` provides confirmation and
reauthentication; deletion and data cleanup require a trusted backend callback.
The starter accepts `VITE_ACCOUNT_DELETE_URL` for that service and disables deletion
when it is absent. Members are stored at
`organizations/{orgId}/members/{uid}`. The owner cannot be removed or demoted by
client rules; ownership transfer and organization deletion require a reviewed
server workflow. Email invitations require a trusted backend; entering an existing
UID does not create a Firebase Auth account. Organization/member lists currently
stop at 100 records and need pagination before supporting larger accounts.

| Role | Read shared files | Upload own files | Delete files | Manage members |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Any in organization | Yes, except owner transfer |
| admin | Yes | Yes | Any in organization | No |
| analyst | Yes | Yes | Own only | No |
| viewer | Yes | No | No | No |

Organization access requires a verified email and active membership. Suspension
blocks subsequent rule-checked reads/writes even with an otherwise valid token;
it cannot erase data already downloaded. Profile access only requires its owner
to be signed in. Users can create organizations themselves; restrict that through
a backend if your commercial model requires provisioning or quotas.

## Evidence storage

```text
organizations/{orgId}/users/{uid}/files/{uuid}_{sanitizedFilename}
```

The UID records authorship; files are **shared with all active members of the
organization**, not private to that user. `OrganizationFiles userId={uid}` browses
another member's prefix; uploads are only available for one's own prefix. Uploads
are limited to 25 MiB, accepted MIME types and immutable UUID objects. Replacement
requires a new upload; metadata changes and overwrites are denied.

Downloads use authenticated SDK reads and download-as-attachment, not persistent
`getDownloadURL` links. Firebase token URLs created outside these helpers remain
bearer links and are not made revocable by these rules; never distribute such URLs
for sensitive evidence. An authorized reader can still copy downloaded bytes.
For strict download mediation, use an authenticated backend with token management.

MIME metadata is supplied by the uploader and is **not malware detection or content
verification**. The library disallows HTML/SVG/executables and does not render file
contents inline. Sensitive production evidence needs server-side quarantine,
content inspection and retention/deletion workflows before making uploads readable.
Do not store discovered plaintext credentials in these general-purpose file/profile
components; any credential intelligence view needs redaction and stricter access.

## EASM application workflows

The main UI exports `ScopeSummary`, `ScanJobList`, `FindingReviewForm` and
`AuditTimeline`. The showcase's **App toolkit** screen demonstrates their props.
Scan cancellation and finding review await your async callbacks and report errors;
job state remains authoritative from your API. The demo's changes are local only.

These do not implement a scheduler, scanning authorization, immutable audit storage,
notifications, asset ownership verification or billing. Keep those on the backend:
verify token and tenant, validate input, check authorized scope, queue the scan and
persist results/review events. Never execute shell commands from the browser or let
clients write an authoritative audit trail. See the repository's backend integration
guide for the existing validated Hydra export adapter.

## Local verification

From the repository, with Node 24 and Java 21:

```sh
npm ci --ignore-scripts
npm run setup:firebase   # install the repository-only CLI from its own lockfile
npm run check            # types, component tests, builds and emulator rule tests
npm run audit            # includes development dependencies; blocks moderate+
npm run audit:signatures
```

For an interactive local flow, start `npm run emulators`, then in a second terminal
set `VITE_FIREBASE_EMULATORS=true` in the starter's `.env.local` and run
`npm run dev:starter`. Auth verification links appear in the emulator output. The
starter uses the non-production `demo-hydra-ui` project in this mode. Production
builds never enable emulator mode. Automated tests mock Auth flows and exercise
real Firestore/Storage rule evaluation, including cross-tenant requests, privilege
escalation, oversized files, overwrite attempts and suspended membership. They do
not replace a staging smoke test against your deployed Firebase configuration.

## Development-tool dependency maintenance

The repository isolates Firebase CLI in `tools/firebase` with its own lockfile.
It uses the corrected `stream-json@3.6.0` plus a version- and SHA-256-checked
migration of the CLI's two legacy consumers to the public Node stream API.
`npm run setup:firebase` installs, applies and tests that migration explicitly.
The fixed depth limit remains enabled and is tested; no audit exception is used.
The root build pins corrected esbuild 0.28.2 as well.

Both dependency trees remain subject to audits and signature verification. See
the repository's `tools/firebase/README.md` for exact scope, compatibility tests
and removal procedure when upstream catches up. These tools are not shipped in
the UI package. Emulator compatibility does not certify every deployment command;
validate your actual deployment against a development project before production.

### Paginated organization access

Use `listOrganizationsPage(services, cursor?)` to retrieve 50 memberships at a time. Follow `nextCursor` even when the returned `organizations` list is empty (suspended memberships are filtered). Reset cursors after a session/app change. `OrganizationPicker` includes Load more; `OrganizationMembers` has next/previous navigation. The legacy `listOrganizations` helper retains its 100-membership limit.

Account deletion requires a trusted cleanup endpoint returning HTTP 204 only after completion. `requestAccountDeletion` rejects queued/ambiguous results and insecure URLs. See the repository's `docs/account-deletion-contract.md`; no server cleanup implementation is included.
