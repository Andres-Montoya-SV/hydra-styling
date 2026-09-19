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

Install repository-only Firebase tools with `npm run setup:firebase`, then run
`npm run audit`, `npm run audit:signatures`, and `npm run check`.
Audits cover development dependencies as well as production dependencies; CI blocks
moderate and higher known advisories. Registry signatures establish registry
integrity, not trustworthiness of the publisher. Attestations may not exist for all
packages. Registry failures fail CI rather than silently skipping verification.

The root lockfile resolves esbuild 0.28.2 through an override, fixing
GHSA-g7r4-m6w7-qqqr. A regenerated lockfile and clean install verify the resolved
version; changing an override without checking the installed tree is insufficient.

Firebase CLI is a private tooling package under `tools/firebase`, with its own
lockfile and mandatory audit. It resolves stream-json 3.6.0, fixing
GHSA-528h-pc64-c93x. The CLI's two legacy consumers require the explicit,
version- and SHA-256-checked API migration in `patch-cli.mjs`. Setup applies it
with lifecycle scripts disabled and runs compatibility tests. Audits have no
exceptions. See [tooling maintenance](tools/firebase/README.md) before upgrading.
Registry signatures cover upstream packages, not our locally reviewed patch.
Remove the patch and overrides when compatible upstream releases make them redundant.

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
