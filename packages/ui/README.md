# Hydra Security UI

React components, Tailwind styling, EASM views and optional Firebase integration.

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
