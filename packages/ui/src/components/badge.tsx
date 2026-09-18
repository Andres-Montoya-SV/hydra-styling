import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.08em]", {
  variants: {
    severity: {
      neutral: "border-hydra-line bg-hydra-surface-strong text-hydra-muted",
      info: "border-hydra-info/35 bg-hydra-info/12 text-hydra-info",
      low: "border-hydra-success/35 bg-hydra-success/12 text-hydra-success",
      medium: "border-hydra-warning/35 bg-hydra-warning/12 text-hydra-warning",
      high: "border-hydra-orange/35 bg-hydra-orange/12 text-hydra-orange",
      critical: "border-hydra-danger/35 bg-hydra-danger/12 text-hydra-danger",
    },
  },
  defaultVariants: { severity: "neutral" },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}
export function Badge({ className, severity, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ severity }), className)} {...props} />;
}
