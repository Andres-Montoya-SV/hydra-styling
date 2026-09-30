# Hydra Security UI

React components, Tailwind styling, EASM views and optional Firebase integration.

Firebase currently pins a Node gRPC version affected by GHSA-m9gg-hp2v-232j and
GHSA-f596-whhp-79r4. Include `"overrides": { "@grpc/grpc-js": "1.13.6" }` in your
application's package.json (already configured in the bundled starter). npm does
not propagate a dependency package's overrides to the application.

Includes Vitral equivalents of all 68 daisyUI component families: dialogs, menus,
tabs, calendars, OTP, validation, galleries, navigation, feedback and mockup frames.
Each is exported from the main package with TypeScript types and compiled styles.
The repository showcase provides searchable previews and usage examples at
`/#components`; the [catalog guide](https://github.com/Andres-Montoya-SV/hydra-styling/blob/main/docs/component-catalog.md)
documents exact coverage and behavior.

Use `DensityProvider` to scope comfortable/compact layouts. Fields share visual
sizes and connect labels, help and errors; buttons support an accessible `loading`
state. See [application foundations](https://github.com/Andres-Montoya-SV/hydra-styling/blob/main/docs/foundations.md)
for composition contracts and the live `/#components/foundations` examples.

```tsx
import {Button, ErrorBoundary, MotionProvider} from '@hydra-security/ui';
import '@hydra-security/ui/styles.css';

export function App() {
  return <ErrorBoundary><MotionProvider><Button>Open workspace</Button></MotionProvider></ErrorBoundary>;
}
```

Import authentication/organizations/files from `@hydra-security/ui/firebase`; the included `starter/` directory shows an entire application. Firebase rules and configuration examples are included in `firebase/`. Configure and deploy rules explicitly for your own project before using real data.

- [Component states and pagination](https://github.com/Andres-Montoya-SV/hydra-styling/blob/main/docs/component-readiness.md)
- [Firebase integration](https://github.com/Andres-Montoya-SV/hydra-styling/blob/main/packages/ui/firebase/README.md)
- [Account deletion contract](https://github.com/Andres-Montoya-SV/hydra-styling/blob/main/docs/account-deletion-contract.md)

Account deletion is disabled until your app supplies its secure cleanup service. UI guards complement server authorization; they do not replace it. Reduced-motion preferences and hidden tabs disable shared animations automatically.
