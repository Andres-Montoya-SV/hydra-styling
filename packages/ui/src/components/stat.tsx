import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface StatProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  delta?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
}

export function Stat({ label, value, delta, icon, trend = "neutral", className, ...props }: StatProps) {
  return (
    <div className={cn("hydra-stat relative overflow-hidden rounded-hydra border border-hydra-line bg-hydra-surface p-4", className)} {...props}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-hydra-muted">{label}</span>
        {icon && <span className="text-hydra-accent" aria-hidden="true">{icon}</span>}
      </div>
      <div className="flex items-end justify-between gap-3">
        <strong className="font-display text-3xl leading-none text-hydra-text">{value}</strong>
        {delta && (
          <span className={cn("text-xs font-bold", trend === "up" && "text-hydra-success", trend === "down" && "text-hydra-danger", trend === "neutral" && "text-hydra-muted")}>
            {trend === "up" ? "↑ " : trend === "down" ? "↓ " : ""}{delta}
          </span>
        )}
      </div>
    </div>
  );
}
