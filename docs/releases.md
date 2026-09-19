# Releasing the library

No publishing or production deployment happens in CI. Keep releases intentional and reviewable.

1. Document user-visible changes under Unreleased in CHANGELOG.md. Describe breaking API or CSS behavior and migration steps.
2. Run `npm run check`, `npm run audit`, and `npm run audit:signatures`. The package gate installs the actual tarball in an isolated copy of the starter, builds it and verifies public ESM/CJS, styles and rules exports.
3. Review `npm pack --dry-run -w @hydra-security/ui`: exclude secrets, private fixtures and generated test reports. Review bundle-size warnings and test the catalog with motion off and on.
4. Choose a semantic version. While on 0.x, incompatible changes require a minor version and migration notes; compatible fixes use a patch. Keep the workspace dependency and starter dependency synchronized; regenerate the root lockfile. The 1.0 release requires an explicit supported-API commitment.
5. Move Unreleased notes to a dated version heading in a release PR. Protect main and require the CI validate check through GitHub repository settings. Files alone cannot enforce branch protections.
6. Publish only from a reviewed commit using npm trusted publishing/provenance where available, with least-privilege repository settings and no long-lived publish token in the app. Configure that separately when the package is ready to release.

The consumer smoke test deliberately resolves dependencies as a new consumer would; a future upstream incompatibility should fail this gate rather than be hidden by workspace symlinks. It does not publish anything. Installation scripts remain disabled.
