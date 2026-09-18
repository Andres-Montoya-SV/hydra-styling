# Contributing

## Development

```bash
npm install
npm run dev
```

Keep public components in `packages/ui/src/components` and export them from `packages/ui/src/index.ts`.

## Component requirements

- Use semantic `hydra-*` tokens; do not add raw brand colors to component markup.
- Preserve native HTML behavior before adding abstractions.
- Every icon-only button needs an accessible name.
- Severity and status must not rely on color alone.
- Verify keyboard focus and reduced-motion behavior.
- Add a test for accessibility wiring or non-trivial state logic.

## Pull request checklist

- `npm run typecheck`
- `npm test`
- `npm run build`
- Check the showcase at narrow and wide viewport widths.
- Check both `nocturne` and `parchment` themes.
