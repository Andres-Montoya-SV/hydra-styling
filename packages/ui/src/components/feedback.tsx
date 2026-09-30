import { type HTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";
import { useHydraLocale } from "./locale";
import { Button } from "./button";

const alertVariants = cva("hydra-alert flex gap-3 border p-4 text-sm", {
  variants: {
    tone: {
      info: "border-hydra-info/45 bg-hydra-info/10 text-hydra-text",
      success: "border-hydra-success/45 bg-hydra-success/10 text-hydra-text",
      warning: "border-hydra-warning/45 bg-hydra-warning/10 text-hydra-text",
      danger: "border-hydra-danger/45 bg-hydra-danger/10 text-hydra-text",
    },
  },
  defaultVariants: { tone: "info" },
});

export interface AlertProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof alertVariants> {
  icon?: ReactNode;
  title?: ReactNode;
  action?: ReactNode;
  variant?: "soft" | "outline";
  onDismiss?: () => void;
  dismissLabel?: string;
}
export function Alert({
  className,
  tone,
  icon,
  title,
  children,
  action,
  variant = "soft",
  onDismiss,
  dismissLabel,
  ...props
}: AlertProps) {
  const { messages } = useHydraLocale();
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      data-variant={variant}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    >
      {icon && (
        <span className="mt-0.5 shrink-0 text-hydra-accent" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="min-w-0">
        {title && <p className="mb-1 font-bold text-hydra-text">{title}</p>}
        <div className="text-hydra-text">{children}</div>
        {action && <div className="hydra-alert-actions">{action}</div>}
      </div>
      {onDismiss && (
        <Button
          className="ms-auto shrink-0"
          size="icon"
          variant="ghost"
          aria-label={dismissLabel ?? messages.dismissNotification}
          onClick={onDismiss}
        >
          ×
        </Button>
      )}
    </div>
  );
}

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  label?: string;
  showValue?: boolean;
}
export function Progress({
  value,
  label,
  showValue = true,
  className,
  ...props
}: ProgressProps) {
  const { messages } = useHydraLocale();
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("grid gap-2", className)} {...props}>
      {(label || showValue) && (
        <div className="flex justify-between text-xs font-semibold text-hydra-muted">
          <span>{label}</span>
          <span>{showValue ? `${safeValue}%` : null}</span>
        </div>
      )}
      <div
        className="h-2 overflow-hidden rounded-full bg-hydra-surface-strong"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeValue}
        aria-label={label ?? messages.progress}
      >
        <div
          className="hydra-progress h-full rounded-full transition-[width] duration-500"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
