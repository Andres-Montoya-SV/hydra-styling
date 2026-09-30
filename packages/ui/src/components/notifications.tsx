import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "./button";
import { useHydraLocale } from "./locale";
import { cn } from "../lib/cn";

export type NotificationTone =
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "loading";
export interface NotificationAction {
  label: string;
  onClick: () => void | Promise<void>;
  /** Successful actions dismiss by default. Rejected actions always remain visible. */
  dismissOnSuccess?: boolean;
}
export interface SnackbarProps {
  children: ReactNode;
  title?: ReactNode;
  tone?: NotificationTone;
  icon?: ReactNode;
  action?: NotificationAction;
  onDismiss?: () => void;
  dismissLabel?: string;
  actionErrorMessage?: string;
  className?: string;
}

function NoticeIcon({ tone }: { tone: NotificationTone }) {
  return (
    <svg
      className={tone === "loading" ? "hydra-notification-spinner" : undefined}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      {tone === "success" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m7.5 12 3 3 6-6" />
        </>
      ) : tone === "loading" ? (
        <path d="M21 12a9 9 0 1 1-9-9" />
      ) : tone === "warning" || tone === "danger" ? (
        <>
          <path d="m12 3 10 18H2L12 3Z" />
          <path d="M12 9v5m0 3v1" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6m0-10v1" />
        </>
      )}
    </svg>
  );
}

/** An in-flow notification. It does not steal focus or own its lifetime. */
export function Snackbar({
  children,
  title,
  tone = "info",
  icon,
  action,
  onDismiss,
  dismissLabel,
  actionErrorMessage,
  className,
}: SnackbarProps) {
  const { messages } = useHydraLocale();
  const [busy, setBusy] = useState(false),
    [failed, setFailed] = useState(false);
  const running = useRef(false),
    alive = useRef(true);
  const generation = useRef(0);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    generation.current++;
    running.current = false;
    setBusy(false);
    setFailed(false);
  }, [action]);
  async function runAction() {
    if (!action || running.current) return;
    running.current = true;
    setBusy(true);
    setFailed(false);
    const started = generation.current;
    try {
      await action.onClick();
      if (
        alive.current &&
        generation.current === started &&
        action.dismissOnSuccess !== false
      )
        onDismiss?.();
    } catch {
      // Never expose raw server errors or turn a rejected callback into an unhandled promise.
      if (alive.current && generation.current === started) setFailed(true);
    } finally {
      if (generation.current === started) {
        running.current = false;
        if (alive.current) setBusy(false);
      }
    }
  }
  return (
    <div className={cn("hydra-snackbar", className)} data-tone={tone}>
      <span className="hydra-snackbar-icon" aria-hidden="true">
        {icon ?? <NoticeIcon tone={tone} />}
      </span>
      <div className="hydra-snackbar-content">
        <div role={tone === "danger" ? "alert" : "status"} aria-atomic="true">
          {title && <p className="hydra-snackbar-title">{title}</p>}
          <div>{children}</div>
        </div>
        {failed && (
          <p role="alert" className="hydra-notification-error">
            {actionErrorMessage ?? messages.notificationActionFailed}
          </p>
        )}
        {action && (
          <Button
            size="sm"
            variant="outline"
            loading={busy}
            onClick={runAction}
          >
            {action.label}
          </Button>
        )}
      </div>
      {onDismiss && (
        <Button
          size="icon"
          variant="ghost"
          data-notification-dismiss=""
          disabled={busy}
          aria-label={dismissLabel ?? messages.dismissNotification}
          onClick={onDismiss}
        >
          ×
        </Button>
      )}
    </div>
  );
}

export interface NotificationOptions extends Omit<
  SnackbarProps,
  "children" | "onDismiss" | "className"
> {
  message: ReactNode;
  /** Reusing a key updates that notification without adding another entry. */
  id?: string;
  /** Milliseconds, or 0 for persistent. Actions, danger and loading are always persistent. */
  duration?: number;
}
export interface Notifications {
  /** Undefined means the bounded queue is full. Show a persistent inline fallback for critical messages. */
  notify: (options: NotificationOptions) => string | undefined;
  update: (id: string, patch: Partial<Omit<NotificationOptions, "id">>) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}
type Notice = NotificationOptions & {
  id: string;
  revision: number;
  opener: HTMLElement | null;
};
const NotificationsContext = createContext<Notifications | null>(null);
export function useNotifications(): Notifications {
  const context = useContext(NotificationsContext);
  if (!context)
    throw new Error("useNotifications requires NotificationProvider.");
  return context;
}
export interface NotificationProviderProps {
  children: ReactNode;
  maxVisible?: number;
  /** Includes visible notifications. New entries are refused when this limit is reached. */
  maxQueue?: number;
  defaultDuration?: number;
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  label?: string;
}
function TimedNotice({
  notice,
  duration,
  paused,
  dismiss,
}: {
  notice: Notice;
  duration: number;
  paused: boolean;
  dismiss: (id: string, revision?: number) => void;
}) {
  const remaining = useRef(duration);
  // An update starts a fresh lifetime; a queued item starts only when it becomes visible.
  useEffect(() => {
    remaining.current = duration;
  }, [duration, notice.revision]);
  useEffect(() => {
    if (!duration || paused) return;
    const start = Date.now();
    const timer = setTimeout(
      () => dismiss(notice.id, notice.revision),
      remaining.current,
    );
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - start));
    };
  }, [duration, paused, notice.id, notice.revision, dismiss]);
  const {
    id,
    revision,
    opener: _opener,
    message,
    duration: _duration,
    ...props
  } = notice;
  return (
    <li data-notification-id={id}>
      <Snackbar {...props} onDismiss={() => dismiss(id, revision)}>
        {message}
      </Snackbar>
    </li>
  );
}

/** Scoped FIFO queue. Persistent by default; timed messages pause for hover, focus, hidden tabs and manual pause. */
export function NotificationProvider({
  children,
  maxVisible = 3,
  maxQueue = 20,
  defaultDuration = 0,
  placement = "bottom-end",
  label,
}: NotificationProviderProps) {
  const { messages } = useHydraLocale();
  const prefix = useId(),
    sequence = useRef(0);
  const [notices, setNotices] = useState<Notice[]>([]),
    current = useRef<Notice[]>([]);
  const [manualPause, setManualPause] = useState(false),
    [hovered, setHovered] = useState(false),
    [focused, setFocused] = useState(false),
    [hidden, setHidden] = useState(false);
  const viewport = useRef<HTMLElement>(null),
    restore = useRef<HTMLElement | null>(null);
  const alive = useRef(true);
  const visibleCount = Math.max(1, Math.min(5, Math.floor(maxVisible) || 3));
  const capacity = useRef(20);
  capacity.current = Math.max(
    visibleCount,
    Math.min(100, Math.floor(maxQueue) || 20),
  );
  const commit = useCallback((items: Notice[]) => {
    if (!alive.current) return;
    current.current = items;
    setNotices(items);
  }, []);
  useEffect(() => {
    alive.current = true;
    const visibility = () => setHidden(document.hidden);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      alive.current = false;
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  const dismiss = useCallback(
    (id: string, revision?: number) => {
      const notice = current.current.find((item) => item.id === id);
      if (!notice || (revision !== undefined && notice.revision !== revision))
        return;
      const element = document.activeElement as HTMLElement | null;
      if (
        element &&
        viewport.current?.contains(element) &&
        element
          ?.closest("[data-notification-id]")
          ?.getAttribute("data-notification-id") === id
      )
        restore.current = notice.opener;
      commit(current.current.filter((item) => item.id !== id));
    },
    [commit],
  );
  const notify = useCallback(
    (options: NotificationOptions) => {
      if (!alive.current) return;
      const id = options.id ?? `${prefix}-${++sequence.current}`;
      const existing = current.current.find((item) => item.id === id);
      if (!existing && current.current.length >= capacity.current) return;
      const next: Notice = {
        ...options,
        id,
        revision: (existing?.revision ?? 0) + 1,
        opener:
          existing?.opener ??
          (typeof document === "undefined"
            ? null
            : (document.activeElement as HTMLElement)),
      };
      commit(
        existing
          ? current.current.map((item) => (item.id === id ? next : item))
          : [...current.current, next],
      );
      return id;
    },
    [prefix, commit],
  );
  const update = useCallback(
    (id: string, patch: Partial<Omit<NotificationOptions, "id">>) => {
      commit(
        current.current.map((item) =>
          item.id === id
            ? { ...item, ...patch, id, revision: item.revision + 1 }
            : item,
        ),
      );
    },
    [commit],
  );
  const clear = useCallback(() => {
    const active =
      typeof document === "undefined" ? null : document.activeElement;
    if (active && viewport.current?.contains(active))
      restore.current = current.current[0]?.opener ?? null;
    commit([]);
  }, [commit]);
  useEffect(() => {
    if (!notices.length) {
      setHovered(false);
      setFocused(false);
    }
    if (!restore.current) return;
    const target =
      viewport.current?.querySelector<HTMLButtonElement>(
        "[data-notification-dismiss]:not(:disabled)",
      ) ?? restore.current;
    if (target.isConnected) target.focus({ preventScroll: true });
    restore.current = null;
  }, [notices]);
  const visible = notices.slice(0, visibleCount),
    queued = notices.length - visible.length;
  const lifetime = (item: Notice) => {
    if (item.action || item.tone === "danger" || item.tone === "loading")
      return 0;
    const value = item.duration ?? defaultDuration;
    return Number.isFinite(value) && value > 0 ? Math.max(1000, value) : 0;
  };
  return (
    <NotificationsContext.Provider value={{ notify, update, dismiss, clear }}>
      {children}
      <section
        ref={viewport}
        className="hydra-notifications"
        data-placement={placement}
        aria-label={label ?? messages.notifications}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setFocused(false);
        }}
      >
        {visible.length > 0 && (
          <div className="hydra-notifications-toolbar">
            {queued > 0 && <span>{messages.queuedNotifications(queued)}</span>}
            {visible.some((item) => lifetime(item) > 0) && (
              <Button
                size="sm"
                variant="outline"
                aria-pressed={manualPause}
                onClick={() => setManualPause((value) => !value)}
              >
                {manualPause
                  ? messages.resumeNotifications
                  : messages.pauseNotifications}
              </Button>
            )}
          </div>
        )}
        <ol>
          {visible.map((notice) => (
            <TimedNotice
              key={notice.id}
              notice={notice}
              duration={lifetime(notice)}
              paused={manualPause || hovered || focused || hidden}
              dismiss={dismiss}
            />
          ))}
        </ol>
      </section>
    </NotificationsContext.Provider>
  );
}
