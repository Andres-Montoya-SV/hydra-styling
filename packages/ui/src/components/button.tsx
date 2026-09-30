import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";
import { useHydraLocale } from "./locale";

export const buttonVariants = cva(
  "hydra-button inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hydra-focus focus-visible:ring-offset-2 focus-visible:ring-offset-hydra-canvas disabled:cursor-not-allowed disabled:opacity-45 active:translate-y-px",
  {
    variants: {
      variant: {
        primary: "hydra-button-primary text-hydra-on-accent",
        secondary: "hydra-button-secondary text-hydra-text",
        outline: "border border-hydra-line bg-transparent text-hydra-text hover:border-hydra-accent hover:text-hydra-accent",
        ghost: "bg-transparent text-hydra-muted hover:bg-hydra-surface-strong hover:text-hydra-text",
        danger: "hydra-button-danger text-white shadow-hydra-sm",
      },
      size: {
        sm: "hydra-size-sm",
        md: "hydra-size-md",
        lg: "hydra-size-lg",
        icon: "hydra-size-md hydra-button-icon",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
  /** Announced while busy. The original button name and width are preserved. */
  loadingLabel?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", disabled, loading = false,
    loadingLabel, children, "aria-busy": ariaBusy, ...props }, ref) => {
    const { messages } = useHydraLocale();
    return (
    <>
      <button
        {...props}
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || ariaBusy || undefined}
        data-loading={loading || undefined}
        className={cn(buttonVariants({ variant, size }), className)}
      >
        <span className="hydra-button-label">{children}</span>
        {loading && <span className="hydra-button-progress" aria-hidden="true"><span /></span>}
      </button>
      {loading && <span className="sr-only" role="status" aria-live="polite">{loadingLabel === undefined ? messages.loading : loadingLabel}</span>}
    </>
  ); },
);
Button.displayName = "Button";
