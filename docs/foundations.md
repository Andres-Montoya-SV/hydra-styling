# Application foundations

This first consolidation pass covers form composition, shared geometry, density and floating surfaces. Existing imports and default themes remain compatible.

## Compose a form

~~~tsx
import {Button, DensityProvider, Field, Input, PasswordInput, Select, Textarea} from '@hydra-security/ui';

<DensityProvider density="compact">
  <Field label="Domain" controlId="domain" hint="Use a hostname."
    error={errors.domain} required controlSize="md">
    <Input name="domain" aria-describedby="scope-policy" />
  </Field>
  <p id="scope-policy">Only approved assets belong in scope.</p>
  <Button type="submit" loading={saving} loadingLabel="Saving scope">Save scope</Button>
</DensityProvider>
~~~

| Contract | Behavior |
| --- | --- |
| Field identity | `controlId` names the control; `id` still names the wrapper. A direct child control's explicit `id` is adopted when `controlId` is absent. |
| Composite controls | Use the exported `useFieldControl` hook and pass an explicit `Field controlId`. The field identity takes precedence over the child's ID; one field represents one control. Wiring exists during SSR. |
| Descriptions | Hint, error and caller `aria-describedby` IDs are merged and deduplicated. Help stays available when an error appears. |
| State | `required`, `disabled`, `readOnly` and `controlSize` inherit from Field, with explicit control props taking precedence. Native select has no readonly state; use disabled or a separate read-only presentation. |
| Sizes | Button keeps `size="sm | md | lg | icon"`. Input, Select, Textarea and PasswordInput use `controlSize="sm | md | lg"`, preserving native numeric `size`. |
| Refs and styling | Inputs and PasswordInput forward their native input ref. Input's `className` remains on its wrapper; `inputClassName` targets the input. |
| Adornments | Leading/trailing slots can contain accessible actions. Set `aria-hidden` on decorative icons explicitly. |
| Busy button | `loading` disables activation, sets `aria-busy`, announces `loadingLabel`, and preserves the existing accessible name and width. Explicit `disabled` still applies after loading ends. |
| Text overrides | Field's `optionalLabel`, PasswordInput's `showLabel`/`hideLabel` and Button's `loadingLabel` can be localized. Full catalog localization remains separate work. |

The application owns validation, requests and completion. An error message does not replace native constraints or server validation. Readonly fields remain in FormData; disabled fields do not.

## Density and tokens

`DensityProvider` accepts `comfortable` (default) or `compact`, forwards HTML div props/ref, and scopes CSS variables. Nested scopes can choose their own density. CSS-only consumers can set `data-hydra-density` directly. Density affects button/input/select heights, textarea padding, fields, cards, native tables and menu rows. It does not change the theme or shrink text globally. Calendar, radio/checkbox geometry and specialized asset views retain their existing layouts in this pass.

| Token family | Purpose |
| --- | --- |
| `--hs-control-height-{sm,md,lg}` | Shared control heights |
| `--hs-control-padding-{sm,md,lg}` | Inline padding |
| `--hs-field-gap`, `--hs-surface-padding`, `--hs-row-padding` | Composition rhythm |
| `--hs-space-1` through `--hs-space-6` | Application spacing scale |
| `--hs-radius-control`, `--hs-radius-surface`, `--hs-radius-floating` | Shared geometry |
| `--hs-motion-fast`, `--hs-motion-normal`, `--hs-motion-theme` | Control, surface and light transitions |
| `--hs-layer-floating` | Fallback floating layer |

Override tokens on an application boundary. Coarse-pointer controls keep a minimum 44px target; compact density is intended primarily for desktop work. The busy indicator respects reduced motion and the shared motion opt-out.

## Floating surfaces

Dropdown and Tooltip share viewport positioning. `placement` accepts `top`, `bottom`, `top-start`, `top-end`, `bottom-start` and `bottom-end`; start/end follow the anchor's direction. Menus prefer bottom-start, tooltips top, and FAB actions top-end.

When the browser supports the Popover API, surfaces enter the native top layer while remaining in their original DOM scope. They retain theme/density inheritance, escape overflow clipping and work inside a native dialog. Placement flips when the opposite side has more space, clamps horizontally, and constrains oversized content to a scrolling surface. Resize, ancestor scroll and visual viewport changes recalculate positioning. A trigger scrolled out of the viewport dismisses its surface.

Escape closes an open menu/tooltip before its containing dialog. Menus retain arrow/Home/End behavior and focus restoration. Tooltips provide a short hover transit delay so the pointer can cross the gap.

Browsers without the Popover API receive fixed positioning with collision handling. Transformed/clipping ancestors can still constrain that fallback; the top-layer guarantee applies to browsers with native Popover support. No third-party positioning dependency is introduced.

## Explore and verify

Open `/#components/foundations` to compare sizes, switch density, inspect nested overrides, exercise loading, and open floating actions in a clipped surface or dialog.

Unit tests cover form identity/descriptions, composite SSR, native form data, refs, loading and positioning geometry. The new browser suite checks actual focus, matching dimensions, clipping, viewport edges, nested Escape behavior, both themes and axe accessibility in desktop/mobile Chromium, desktop Firefox and WebKit.

~~~sh
npx --no-install playwright install --with-deps chromium firefox webkit
npm run setup:firebase
npm run check
~~~

Cross-browser coverage currently targets the foundations suite; the existing full catalog/browser flows continue in Chromium. Visual regression baselines, advanced data controls, optional Firebase packaging and complete localization are subsequent work.
