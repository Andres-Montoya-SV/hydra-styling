# Security policy

## Scope and limits

This repository uses exact direct dependency versions, a committed integrity-bearing
lockfile, script-disabled installs, read-only CI tokens, SHA-pinned actions, and
dependency/signature audits. These reduce risk; they do not certify dependencies as
non-malicious. Build tools and tests still execute dependency code. Do not run an
untrusted branch on a machine with production credentials.

## Local workflow

Use Node 24 LTS and `npm ci`. The repository `.npmrc` disables installation lifecycle
scripts by default. Explicit commands such as `npm run build` still execute.
Do not globally re-enable scripts or use `npm audit fix --force` as a routine fix.
If a future native dependency needs an install script, review that exact package
and version before adding a narrowly scoped exception and testing it in isolation.

Run `npm run audit`, `npm run audit:signatures`, and `npm run check`.
Audits cover development dependencies as well as production dependencies; CI blocks
moderate and higher known advisories. Registry signatures establish registry
integrity, not trustworthiness of the publisher. Attestations may not exist for all
packages. Registry failures fail CI rather than silently skipping verification.

Known residual advisory: esbuild 0.27.7 is affected by GHSA-g7r4-m6w7-qqqr
(low severity, development server on Windows). The attempted 0.28.1 override did
not change the resolved tree and was removed; this is NOT reported as fixed.
Do not expose an esbuild development server on Windows. Review an upstream tsup
upgrade or a separately validated bundler migration; recheck the audit at release.
Vitest 4.1.11 addresses GHSA-82fw-gwwq-j7x9.

## Repository settings — manual activation required

Committing these files does NOT enable account/repository security settings:

- Protect `main`: require pull requests and the `validate` status check, block force
  pushes and deletion, restrict bypass. With another maintainer, require an independent
  approval and code-owner review; the sole author cannot approve their own PR.
- Enable Dependabot alerts and security updates; review dependency PRs and lockfile
  changes. Do not auto-merge them solely because tests pass.
- Enable secret scanning/push protection and code scanning if supported by the private
  repository's plan. Availability must be checked in Settings; it is not assumed here.
- Require account 2FA, review installed apps and deploy keys, remove unused access.
- Keep Actions read-only by default, limit allowed actions, and require approval for
  untrusted contributors. Never execute PR code with `pull_request_target` secrets.
- Use disposable hosted runners for untrusted builds, not a privileged self-hosted runner.

## Publication

No publish workflow is enabled. Before publishing, configure npm trusted publishing
with OIDC, protected release environments and reviewer approval, provenance, and
minimal release-only permissions. Do not add long-lived npm tokens to PR workflows.
Inspect the packed files, record an SBOM, and separate release credentials from builds.
Root overrides and this repository's lockfile do not constrain consumers' installs.

## Reporting and response

Do not post secrets or exploit details in a public issue. Contact the repository
owner privately through an established channel, or use GitHub private vulnerability
reporting if it is enabled. No unverified reporting email is supplied here.
If compromise is suspected: halt releases, revoke exposed credentials, identify
affected commits/artifacts, rebuild from reviewed inputs, and notify consumers.
