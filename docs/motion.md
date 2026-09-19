# Motion and composition

```tsx
import {MotionProvider, Motion, Field, Input, Footer} from '@hydra-security/ui';
import '@hydra-security/ui/styles.css';

<MotionProvider enabled={true}>
  <Motion><Field label="Target"><Input /></Field></Motion>
  <Footer variant="complete" groups={[
    {title:'Resources',links:[{label:'Documentation',href:'/docs'}]}
  ]}/>
</MotionProvider>
```

Anime.js 4.5.0 provides short entry and input-focus animations. No animation is
required to reveal content or complete an action. Provider defaults are conservative
on the server, with media-query observation after mounting. OS reduced-motion and
parent `enabled={false}` override child opt-in. Effects revert animations on cleanup,
disable, preference changes and unmount; input blur restores native focus styling.
Explicit provider opt-out also suppresses existing CSS transitions. Fields retain
native validation, labels, refs and change events. Do not use motion to convey
severity, submission success or validation errors without text.

Use `Motion enabled={false}` for a static entrance and `MotionProvider enabled={false}`
for a fully static region. Entrance transforms should wrap layout rather than
compete with transforms on the same element. No perpetual loops or typing animation.

Footers have `simple`, `complete`, and `expressive` variants. Supply real navigation
destinations and copyright text. The expressive landscape is CSS geometry and the
approved HydraMark is unchanged. It is suited to brand pages; use quieter variants
on dense security screens.

The showcase provides hash navigation to each screen, a global motion switch,
side-by-side animated/static examples, functional sample filters and recon preview.
Product screens contain sample data, not backend integrations. Reports do not claim
to download files, settings are local state. No real scans are launched.

Reference: https://animejs.com/documentation/getting-started/using-with-react/
