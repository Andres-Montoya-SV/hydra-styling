import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { Button } from "./button";
import { Modal } from "./catalog-overlays";
import { useControllable } from "./catalog-shared";
import { useHydraLocale } from "./locale";
import { useFloatingSurface } from "../lib/use-floating-surface";
import type { FloatingPlacement } from "../lib/floating-position";
import { cn } from "../lib/cn";

export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children?: ReactNode;
  /** Application owns execution, errors and closing after successful confirmation. */
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "info";
  loading?: boolean;
  /** The opener, or another logical target if confirmation removes the opener. */
  returnFocusRef?: RefObject<HTMLElement | null>;
}
/** Explicit confirmation with initial focus on Cancel and no backdrop dismissal. */
export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onConfirm,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  loading = false,
  returnFocusRef,
}: AlertDialogProps) {
  const { messages } = useHydraLocale();
  const cancel = useRef<HTMLButtonElement>(null);
  return (
    <Modal
      open={open}
      onOpenChange={(value) => {
        if (!loading) onOpenChange(value);
      }}
      title={title}
      description={description}
      role="alertdialog"
      initialFocusRef={cancel}
      returnFocusRef={returnFocusRef}
      showCloseButton={false}
      dismissOnOutsideClick={false}
      footer={
        <>
          <Button
            ref={cancel}
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel ?? messages.cancel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel ?? messages.confirm}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}

export interface PopoverProps {
  label: string;
  title: string;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: FloatingPlacement;
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
}
/** Non-modal rich content, positioned by the same native top-layer engine as menus. */
export function Popover({
  label,
  title,
  children,
  open: controlled,
  defaultOpen = false,
  onOpenChange,
  placement = "bottom-start",
  initialFocusRef,
  className,
}: PopoverProps) {
  const [open, setOpen] = useControllable(
    controlled,
    defaultOpen,
    onOpenChange,
  );
  const change = useRef(setOpen);
  change.current = setOpen;
  const root = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    surface = useRef<HTMLDivElement>(null);
  const id = useId(),
    titleId = useId();
  function close(restore = false) {
    setOpen(false);
    if (restore) trigger.current?.focus();
  }
  useFloatingSurface(open, trigger, surface, placement, () => close());
  useEffect(() => {
    if (!open) return;
    const element = surface.current;
    const first =
      initialFocusRef?.current ??
      surface.current?.querySelector<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
      ) ??
      surface.current;
    first?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) change.current(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      if (
        trigger.current?.isConnected &&
        (document.activeElement === document.body ||
          element?.contains(document.activeElement))
      )
        trigger.current.focus({ preventScroll: true });
    };
  }, [open, initialFocusRef]);
  return (
    <div
      ref={root}
      className="hydra-popover-root"
      onBlurCapture={(event) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          setOpen(false);
      }}
      onKeyDown={(event) => {
        if (open && event.key === "Escape" && !event.defaultPrevented) {
          event.preventDefault();
          event.stopPropagation();
          close(true);
        }
      }}
    >
      <Button
        ref={trigger}
        variant="outline"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen(!open)}
      >
        {label}
      </Button>
      {open && (
        <div
          ref={surface}
          id={id}
          role="dialog"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={cn("hydra-popover", className)}
        >
          <h3 id={titleId}>{title}</h3>
          {children}
        </div>
      )}
    </div>
  );
}
