import { useHydraLocale } from "./locale";
import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { useFloatingSurface } from "../lib/use-floating-surface";
import type { FloatingPlacement } from "../lib/floating-position";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  description?: string;
  footer?: ReactNode;
  className?: string;
  closeLabel?: string;
}

/** Native top-layer dialog supplies focus containment, inert background and Escape. */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  closeLabel,
}: ModalProps) {
  const { messages } = useHydraLocale();
  if (closeLabel === undefined) closeLabel = messages.closeDialog;

  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId(),
    descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={cn("hydra-modal", className)}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onKeyDown={(event) => {
        if (
          event.key !== "Tab" ||
          (event.target as HTMLElement).closest("dialog") !==
            event.currentTarget
        )
          return;
        // Keep Tab inside the content instead of cycling through browser chrome.
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button, a[href], input, select, textarea, summary, [tabindex], [contenteditable="true"]',
          ),
        ).filter(
          (element) =>
            element.tabIndex >= 0 &&
            !element.matches(":disabled") &&
            element.getClientRects().length > 0,
        );
        const first = controls[0],
          last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={() => {
        if (open && !ref.current?.open) onOpenChange(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const box = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          )
            onOpenChange(false);
        }
      }}
    >
      <header className="hydra-modal-header">
        <h2 id={titleId}>{title}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          aria-label={closeLabel}
        >
          ×
        </Button>
      </header>
      {description && (
        <p id={descriptionId} className="hydra-muted">
          {description}
        </p>
      )}
      <div className="hydra-modal-body">{children}</div>
      {footer && <footer className="hydra-modal-footer">{footer}</footer>}
    </dialog>
  );
}

export function Drawer({
  side = "right",
  className,
  ...props
}: ModalProps & { side?: "left" | "right" }) {
  return (
    <Modal
      {...props}
      className={cn("hydra-drawer", `hydra-drawer-${side}`, className)}
    />
  );
}

export interface DropdownItem {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
}
export function Dropdown({
  label,
  items,
  className,
  placement = "bottom-start",
}: {
  label: string;
  items: DropdownItem[];
  className?: string;
  placement?: FloatingPlacement;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    surface = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const pendingIndex = useRef(0);
  function close(restore = false) {
    setOpen(false);
    if (restore) trigger.current?.focus();
  }
  useFloatingSurface(open, trigger, surface, placement, () => close());
  useEffect(() => {
    if (!open) return;
    const buttons = root.current?.querySelectorAll<HTMLButtonElement>(
      '[role="menuitem"]:not(:disabled)',
    );
    (pendingIndex.current < 0
      ? buttons?.[buttons.length - 1]
      : buttons?.[0]
    )?.focus();
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return (
    <div
      ref={root}
      className={cn("hydra-dropdown", className)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          event.stopPropagation();
          close(true);
        }
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) close();
      }}
    >
      <Button
        ref={trigger}
        variant="outline"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          pendingIndex.current = 0;
          setOpen(!open);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            pendingIndex.current = e.key === "ArrowUp" ? -1 : 0;
            setOpen(true);
          }
        }}
      >
        {label} <span aria-hidden="true">⌄</span>
      </Button>
      {open && (
        <div
          ref={surface}
          id={menuId}
          role="menu"
          aria-label={label}
          className="hydra-dropdown-menu hydra-floating-surface"
          onKeyDown={(e) => {
            const buttons = Array.from(
              e.currentTarget.querySelectorAll<HTMLButtonElement>(
                '[role="menuitem"]:not(:disabled)',
              ),
            );
            const index = buttons.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              close(true);
            }
            if (
              ["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key) &&
              buttons.length
            ) {
              e.preventDefault();
              const next =
                e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? buttons.length - 1
                    : (index +
                        (e.key === "ArrowDown" ? 1 : -1) +
                        buttons.length) %
                      buttons.length;
              buttons[next]?.focus();
            }
          }}
        >
          {items.map((item) => (
            <button
              type="button"
              key={item.id}
              role="menuitem"
              tabIndex={-1}
              disabled={item.disabled}
              className={item.danger ? "hydra-danger-text" : undefined}
              onClick={() => {
                close(true);
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Fab({
  label,
  actions,
}: {
  label: string;
  actions: DropdownItem[];
}) {
  return <Dropdown label={label} items={actions} placement="top-end" className="hydra-fab" />;
}

export function Tooltip({
  content,
  children,
  placement = "top",
}: {
  content: string;
  placement?: FloatingPlacement;
  children: ReactElement<HTMLAttributes<HTMLElement>>;
}) {
  const [open, setOpen] = useState(false),
    id = useId();
  const anchor = useRef<HTMLSpanElement>(null), surface = useRef<HTMLSpanElement>(null);
  useFloatingSurface(open, anchor, surface, placement, () => setOpen(false));
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(leaveTimer.current), []);
  const hover = useRef(false),
    focus = useRef(false);
  useEffect(() => {
    if (!open) return;
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);
  return (
    <span
      ref={anchor}
      className="hydra-tooltip"
      onPointerEnter={() => {
        clearTimeout(leaveTimer.current);
        hover.current = true;
        setOpen(true);
      }}
      onPointerLeave={() => {
        hover.current = false;
        clearTimeout(leaveTimer.current);
        if (!focus.current) leaveTimer.current = setTimeout(() => setOpen(false), 160);
      }}
      onFocus={() => {
        focus.current = true;
        setOpen(true);
      }}
      onBlur={() => {
        focus.current = false;
        if (!hover.current) setOpen(false);
      }}
    >
      {cloneElement(children, {
        "aria-describedby":
          [children.props["aria-describedby"], open ? id : undefined]
            .filter(Boolean)
            .join(" ") || undefined,
      })}
      {open && (
        <span ref={surface} role="tooltip" id={id} className="hydra-tooltip-content hydra-floating-surface">
          {content}
        </span>
      )}
    </span>
  );
}

export interface ToastProps {
  children: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  tone?: "info" | "success" | "danger";
}
/** Persistent by default: callers control lifetime so messages do not vanish before being read. */
export function Toast({
  children,
  onDismiss,
  dismissLabel,
  tone = "info",
}: ToastProps) {
  const { messages } = useHydraLocale();
  if (dismissLabel === undefined) dismissLabel = messages.dismissNotification;

  return (
    <div className="hydra-toast" data-tone={tone}>
      <div role={tone === "danger" ? "alert" : "status"}>{children}</div>
      {onDismiss && (
        <Button
          size="icon"
          variant="ghost"
          aria-label={dismissLabel}
          onClick={onDismiss}
        >
          ×
        </Button>
      )}
    </div>
  );
}
