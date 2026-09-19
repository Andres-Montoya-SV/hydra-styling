# Changelog

## Unreleased

- Add a reusable ErrorBoundary and recovery screens to the showcase and starter.
- Stop shared motion effects while the document is hidden.
- Add cursor pagination for organizations and member lists, with runtime member validation.
- Add a strict, cancellable account-deletion HTTP client and document the required backend contract. The cleanup backend remains an application responsibility.
- Add Playwright browser flows, axe accessibility checks, Firebase emulator integration and isolated npm-package installation to CI.
- Document component states, integration boundaries and release/versioning requirements.

Migration: the starter deletion endpoint must now return HTTP 204 (previously 200 was also accepted). Pending/queued responses never count as completed deletion.
