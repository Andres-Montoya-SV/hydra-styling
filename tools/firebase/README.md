# Repository-only Firebase tooling

This private package lives outside the application's npm workspaces. It owns the
Firebase CLI and a separate lockfile; it is not shipped in Hydra UI. It is
dependency separation, not a sandbox. Use Node 24 and Java 21.

```sh
# From the repository root
npm ci --ignore-scripts
npm run setup:firebase
npm run check
npm run audit
npm run audit:signatures
```

Setup explicitly installs this lockfile with lifecycle scripts disabled, applies
the reviewed compatibility migration and runs its tests. A plain install of this
directory alone is insufficient. Commands do not use global Firebase or fetch
versions through npx. CI audits both dependency trees; Dependabot watches both.
No production credentials are needed.

## Compatibility migration

Firebase CLI 15.30.2 still requests stream-json 1.x. The security fix for
[GHSA-528h-pc64-c93x](https://github.com/advisories/GHSA-528h-pc64-c93x) starts in
3.5.0. A bare override breaks legacy imports and stream APIs. We pin 3.6.0 and
`patch-cli.mjs` migrates exactly two consumers to public Node stream APIs:

- Database importer: lowercase paths, `withParserAsStream`, `streamObject.asStream`.
- Next.js dependency discovery: lowercase paths, `parserStream`, `pick.asStream`
  and `streamObject.asStream`.

Existing pipelines and parser options are preserved. Depth limits remain enabled;
there is no replacement parser, audit suppression or module-loader interception.
This relies on Node 24's synchronous ESM loading from CommonJS.

The script requires exact CLI/dependency versions and validates SHA-256 of both
original files before writing either. Reapplying the exact patch is safe; unknown
or partially modified files stop setup. Registry signatures verify downloaded
packages, **not our local modifications**. Those are reviewed as repository source
and tested explicitly. There are no installation lifecycle hooks.

## Tests and limits

Compatibility tests cover CLI startup, idempotence, rejection of upstream changes,
nested npm-ls dependency discovery, the actual database importer with network
writes replaced by a test callback, malformed JSON and excessive nesting. The
full check also runs component tests, builds and Firestore/Storage rule tests.

This does not certify every Firebase CLI feature or perform a real deployment.
The patched tool is maintained for Hydra's emulator workflow. Validate deployments
separately against a development project before production use.

## Updating or removing the patch

Do not change versions or hashes merely to bypass a setup failure. Inspect all
stream-json consumers in the new official CLI. If it supports the corrected API
natively, remove the patch step and stream-json override together, regenerate the
lockfile, and run clean setup, full checks, both audits and signature verification.
Otherwise review and update the migration and tests. Review the scoped csv-parse,
uuid and @opentelemetry/core overrides when updating upstream tooling as well.

The root esbuild override pins 0.28.2 to fix GHSA-g7r4-m6w7-qqqr; tsup's current
range excludes that fix. Actual library/showcase/starter builds validate its use.
Remove the override when the build tools accept a fixed version natively.
