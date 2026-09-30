# Vitral visual regression

The checked-in PNGs in `tests/visual/baselines/` are the reviewed reference for
`/#components/consistency` and `/#components/feedback`. There are 19 scenarios:
both themes and densities on desktop, both themes at 390px, six application states,
a Spanish RTL composition with an open native popover, four feedback layouts and
Brazilian Portuguese form/notification compositions. Interaction and axe tests run separately.

## Reproduce and review

```sh
npm ci --ignore-scripts
npm run build
npm run test:visual
```

The canonical renderer is **Linux x64** with the exact npm-pinned
`@sparticuz/chromium@153.0.0` binary. The wrapper extracts that package's own assets;
there is no browser CDN download or package install hook. It also isolates font
configuration. Other platforms can inspect the committed PNGs and the CI report;
use a Linux x64 checkout to reproduce or update the canonical baselines.

The showcase bundles Inter 400/500/600/700 from pinned `@fontsource/inter`; no
remote font request is needed. The SIL OFL notice is served as `/Inter-OFL.txt`.
The component package still lets consumers choose their own font assets.

Tests fix date, locale, timezone, viewport and device scale, await font loading,
and disable animations/carets. Component captures exclude the surrounding sticky
application header; the preview's own headers, controls and overlays remain visible.
Visual reports/results use separate directories from interaction tests.
Diff tolerance is 0.1% of pixels with a 0.15 color
threshold, to allow tiny rasterization noise while catching geometry/color changes.
Missing baselines fail validation. No snapshots are auto-approved in CI.

For an intentional visual change on Linux x64:

```sh
npm run test:visual:update
npm run test:visual
```

Inspect **every changed PNG**, including mobile overflow, labels, focus/validation
visibility and contrast. Commit the updated images with the UI change and explain
why the differences are intentional in the PR. Updating snapshots only to silence
a failure is not review. A browser/font version update is also a visual change and
must regenerate and review the baselines.

CI runs the visual gate after the full interaction/package/emulator checks. On
failure the existing `browser-diagnostics` artifact includes expected, actual and
diff images plus the HTML report and trace. CI rejects update-snapshot flags.

The normal Playwright suite uses its standard Chromium, Firefox and WebKit
installations. Pinning the visual renderer does not replace cross-browser tests.
