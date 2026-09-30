// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { StrictMode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import {
  Alert,
  LocaleProvider,
  NotificationProvider,
  Snackbar,
  useNotifications,
  type Notifications,
  type NotificationProviderProps,
} from "./index";
let api: Notifications;
function Capture() {
  api = useNotifications();
  return <button>Origin</button>;
}
function setup(props: Omit<NotificationProviderProps, "children"> = {}) {
  return render(
    <StrictMode>
      <NotificationProvider {...props}>
        <Capture />
      </NotificationProvider>
    </StrictMode>,
  );
}
function advance(ms: number) {
  act(() => vi.advanceTimersByTime(ms));
}
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it("bounds the FIFO queue without dropping existing messages and deduplicates identifiers", () => {
  setup({ maxVisible: 1, maxQueue: 2 });
  act(() => {
    expect(api.notify({ id: "a", message: "First" })).toBe("a");
    api.notify({ id: "b", message: "Second" });
    expect(api.notify({ message: "Overflow" })).toBeUndefined();
  });
  expect(screen.getByText("First")).toBeVisible();
  expect(screen.queryByText("Second")).not.toBeInTheDocument();
  act(() => api.notify({ id: "a", message: "Updated" }));
  expect(screen.queryByText("First")).not.toBeInTheDocument();
  expect(screen.getByText("Updated")).toBeVisible();
  act(() => api.dismiss("a"));
  expect(screen.getByText("Second")).toBeVisible();
  act(() => api.update("missing", { message: "Resurrected" }));
  expect(screen.queryByText("Resurrected")).not.toBeInTheDocument();
});
it("starts a queued timer only when visible, and an update starts a fresh lifetime", () => {
  vi.useFakeTimers();
  setup({ maxVisible: 1 });
  act(() => {
    api.notify({ id: "first", message: "First", duration: 1000 });
    api.notify({ id: "next", message: "Second", duration: 2000 });
  });
  advance(1000);
  expect(screen.getByText("Second")).toBeVisible();
  advance(1500);
  act(() => api.update("next", { message: "Fresh" }));
  advance(1500);
  expect(screen.getByText("Fresh")).toBeVisible();
  advance(500);
  expect(screen.queryByText("Fresh")).not.toBeInTheDocument();
});
it("persists default, danger, loading and actionable messages despite explicit timeouts", () => {
  vi.useFakeTimers();
  setup({ maxVisible: 5 });
  act(() => {
    api.notify({ message: "Persistent" });
    api.notify({ tone: "danger", message: "Error", duration: 1000 });
    api.notify({ tone: "loading", message: "Working", duration: 1000 });
    api.notify({
      message: "Undoable",
      duration: 1000,
      action: { label: "Undo", onClick() {} },
    });
  });
  advance(100000);
  for (const message of ["Persistent", "Error", "Working", "Undoable"])
    expect(screen.getByText(message)).toBeVisible();
});
it("pauses and resumes the remaining duration for hover and manual pause", () => {
  vi.useFakeTimers();
  setup();
  act(() => api.notify({ message: "Timed", duration: 3000 }));
  advance(1000);
  const region = screen.getByRole("region", { name: "Notifications" });
  fireEvent.pointerEnter(region);
  advance(6000);
  expect(screen.getByText("Timed")).toBeVisible();
  fireEvent.pointerLeave(region);
  advance(1000);
  fireEvent.click(screen.getByRole("button", { name: "Pause dismissals" }));
  advance(6000);
  fireEvent.click(screen.getByRole("button", { name: "Resume dismissals" }));
  advance(999);
  expect(screen.getByText("Timed")).toBeVisible();
  advance(1);
  expect(screen.queryByText("Timed")).not.toBeInTheDocument();
});
it("pauses while focus is in the viewport or the document is hidden", () => {
  vi.useFakeTimers();
  setup();
  act(() => api.notify({ message: "Timed", duration: 2000 }));
  act(() =>
    screen.getByRole("button", { name: "Dismiss notification" }).focus(),
  );
  advance(4000);
  expect(screen.getByText("Timed")).toBeVisible();
  act(() => screen.getByText("Origin").focus());
  advance(500);
  const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  fireEvent(document, new Event("visibilitychange"));
  advance(4000);
  expect(screen.getByText("Timed")).toBeVisible();
  hidden.mockReturnValue(false);
  fireEvent(document, new Event("visibilitychange"));
  advance(1500);
  expect(screen.queryByText("Timed")).not.toBeInTheDocument();
});
it("does not steal focus and restores it after a focused notification is dismissed", () => {
  setup();
  const origin = screen.getByText("Origin");
  act(() => origin.focus());
  act(() => api.notify({ message: "Saved" }));
  expect(origin).toHaveFocus();
  const dismiss = screen.getByRole("button", { name: "Dismiss notification" });
  act(() => dismiss.focus());
  fireEvent.click(dismiss);
  expect(origin).toHaveFocus();
});
it("catches async failures, prevents duplicate actions, and allows a successful retry", async () => {
  let reject!: (reason: Error) => void;
  const action = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<void>((_, no) => {
          reject = no;
        }),
    )
    .mockResolvedValueOnce(undefined);
  const dismiss = vi.fn();
  render(
    <LocaleProvider locale="pt-BR">
      <Snackbar
        onDismiss={dismiss}
        action={{ label: "Tentar", onClick: action }}
      >
        Aviso
      </Snackbar>
    </LocaleProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Tentar" }));
  fireEvent.click(screen.getByRole("button", { name: "Tentar" }));
  expect(action).toHaveBeenCalledTimes(1);
  expect(
    screen.getByRole("button", { name: "Dispensar notificação" }),
  ).toBeDisabled();
  await act(async () => reject(new Error("secret server data")));
  expect(screen.getByRole("alert")).not.toHaveTextContent("secret");
  expect(dismiss).not.toHaveBeenCalled();
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Tentar" })),
  );
  expect(dismiss).toHaveBeenCalledTimes(1);
});
it("ignores completion of a replaced action and keeps the replacement usable", async () => {
  let finish!: () => void;
  setup();
  act(() =>
    api.notify({
      id: "job",
      message: "First action",
      action: {
        label: "Start",
        onClick: () =>
          new Promise<void>((yes) => {
            finish = yes;
          }),
      },
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Start" }));
  act(() =>
    api.update("job", {
      message: "Replacement",
      action: { label: "Continue", onClick() {} },
    }),
  );
  await act(async () => finish());
  expect(screen.getByText("Replacement")).toBeVisible();
  expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
});
it("cleans timers and callbacks on unmount and does not leak across providers", async () => {
  vi.useFakeTimers();
  const view = setup();
  const old = api;
  act(() => api.notify({ message: "Old", duration: 1000 }));
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
  setup();
  act(() => {
    old.notify({ message: "Leak" });
    old.update("a", { message: "Leak" });
  });
  advance(5000);
  expect(screen.queryByText("Leak")).not.toBeInTheDocument();
  expect(
    renderToString(
      <NotificationProvider>
        <Capture />
      </NotificationProvider>,
    ),
  ).toContain("Notifications");
});
it("renders custom alert content, actions and a localized dismiss label", () => {
  const dismiss = vi.fn();
  render(
    <LocaleProvider locale="pt-BR">
      <Alert
        tone="warning"
        variant="outline"
        title={<strong>Revisão</strong>}
        action={<button>Revisar</button>}
        onDismiss={dismiss}
      >
        Permissão
      </Alert>
    </LocaleProvider>,
  );
  const alert = screen.getByRole("status");
  expect(alert).toHaveAttribute("data-variant", "outline");
  expect(within(alert).getByRole("button", { name: "Revisar" })).toBeVisible();
  fireEvent.click(
    within(alert).getByRole("button", { name: "Dispensar notificação" }),
  );
  expect(dismiss).toHaveBeenCalledOnce();
});

it("restores the origin instead of targeting a disabled pending notification", () => {
  setup();
  const origin = screen.getByText("Origin");
  act(() => origin.focus());
  act(() => {
    api.notify({ message: "First" });
    api.notify({
      message: "Busy",
      action: { label: "Run", onClick: () => new Promise<void>(() => {}) },
    });
  });
  fireEvent.click(screen.getByRole("button", { name: "Run" }));
  const buttons = screen.getAllByRole("button", {
    name: "Dismiss notification",
  });
  expect(buttons[1]).toBeDisabled();
  act(() => buttons[0].focus());
  fireEvent.click(buttons[0]);
  expect(origin).toHaveFocus();
});

it("does not move focus across providers that reuse the same application notification ID", () => {
  const scopes: Record<string, Notifications> = {};
  function Scope({ name }: { name: string }) {
    scopes[name] = useNotifications();
    return <button>{name}</button>;
  }
  render(
    <>
      <NotificationProvider label="First queue">
        <Scope name="First origin" />
      </NotificationProvider>
      <NotificationProvider label="Second queue">
        <Scope name="Second origin" />
      </NotificationProvider>
    </>,
  );
  act(() => screen.getByText("First origin").focus());
  act(() => {
    scopes["First origin"].notify({ id: "save", message: "First notice" });
    scopes["Second origin"].notify({ id: "save", message: "Second notice" });
  });
  const second = within(
    screen.getByRole("region", { name: "Second queue" }),
  ).getByRole("button", { name: "Dismiss notification" });
  act(() => second.focus());
  act(() => scopes["First origin"].dismiss("save"));
  expect(second).toHaveFocus();
  expect(screen.getByText("Second notice")).toBeVisible();
});
