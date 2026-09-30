# Application feedback

Use an inline `Alert` for context that must remain next to the affected content.
It accepts `title`, `icon`, `action`, `tone`, `variant="soft" | "outline"`, and
optional `onDismiss`/`dismissLabel`. Existing calls remain compatible. Use
`Snackbar` for an individual message with an optional asynchronous action, or
`NotificationProvider` for a scoped queue. `Toast` remains supported.

```tsx
<LocaleProvider locale="pt-BR">
  <ThemeProvider>
    <NotificationProvider maxVisible={3} maxQueue={20}>
      <App />
    </NotificationProvider>
  </ThemeProvider>
</LocaleProvider>
```

Place the provider at the application boundary, inside theme/locale scopes and
outside transformed or clipped containers. Its viewport is fixed and uses logical
start/end placement. It is not portaled out of the locale/theme tree. Native modal
dialogs remain above it: show blocking-operation errors **inside the dialog**.

```tsx
const { notify, update, dismiss, clear } = useNotifications();
const id = notify({ id: "save-scope", tone: "loading", message: "Saving scope…" });
// In the application's successful save callback:
if (id) update(id, { tone: "success", message: "Scope saved.", duration: 6000 });
// Or provide an action (persistent until resolved/dismissed):
notify({ message: "Item archived.", action: { label: "Undo", onClick: restoreItem } });
```

The application owns I/O, business errors, retries and translations of message
content. Never show success until the operation succeeds. Notification APIs do
not execute work automatically. For long tasks, cancel stale callbacks when their
owner unmounts. `update` ignores missing/dismissed IDs; it never revives a message.
An existing `id` replaces its message and restarts its lifetime without adding a
second entry. Clear only your provider's queue.

| Behavior | Contract |
| --- | --- |
| Lifetime | Persistent by default (`duration: 0`); opt-in positive durations have a 1000ms minimum |
| Critical/action messages | `danger`, `loading` and any message with an action always persist, even when a duration is supplied |
| Pause | Hover, focus within the viewport, hidden document and the pause button suspend timers; remaining time resumes afterward |
| Queue | FIFO, 3 visible/20 total by default, bounded to 1–5 visible and at most 100 total; queued time starts upon visibility |
| Full queue | `notify` returns `undefined`; existing messages are preserved. Display critical errors inline or update a stable ID |
| Action | Successful action dismisses unless `dismissOnSuccess: false`; rejected action stays and displays localized recovery text |
| Action failure | Generic localized error; override with `actionErrorMessage`. Raw exception details are not rendered |
| Pending action | Duplicate activation and its dismiss button are disabled; replacement actions ignore stale completion |
| Focus | Emission never focuses the viewport; dismissing a focused message restores the next dismiss control or connected origin |
| Announcements | Status semantics for normal messages; alert semantics for errors; icons and text supplement tone |
| Scope/SSR | Provider-local state, no module-global queue, no browser access during render, listeners/timers cleaned on unmount |

For decisions requiring explicit consent, use `AlertDialog`. Its controlled `open`
state and `onConfirm` leave asynchronous success/error ownership with your app.
Focus starts on Cancel; outside clicks do not dismiss. Escape/Cancel close unless
`loading` is true. During loading, confirmation/cancel are disabled. Always release
loading and show a recoverable inline error after failure.

`Popover` provides named, non-modal rich content. It focuses its first control
(or `initialFocusRef`), closes on Escape, blur outside or outside pointer activation,
and restores its trigger when closure would otherwise lose focus. It shares
Hydra's floating engine: collision handling, RTL alignment, native top layer and
fixed-position fallback. Prefer `Tooltip` for supplementary text and `Modal` for
a multi-step or blocking task.

See the interactive demos and generated props at `/#components/feedback`.
