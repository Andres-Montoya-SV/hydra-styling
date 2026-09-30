import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type ControlSize = "sm" | "md" | "lg";
export type HydraDensity = "comfortable" | "compact";
export interface DensityProviderProps extends HTMLAttributes<HTMLDivElement> {
  density?: HydraDensity;
}

/** Density is inherited through CSS, including nested themes and native popovers. */
export const DensityProvider = forwardRef<HTMLDivElement, DensityProviderProps>(
  ({ density = "comfortable", className, ...props }, ref) => (
    <div {...props} ref={ref} className={cn("hydra-density", className)} data-hydra-density={density} />
  ),
);
DensityProvider.displayName = "DensityProvider";
