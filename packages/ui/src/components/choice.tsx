import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type ChoiceProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  description?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, ChoiceProps>(({ label, description, className, id, ...props }, ref) => {
  const generatedId = useId();
  const resolvedId = id ?? generatedId;
  return (
    <label htmlFor={resolvedId} className={cn("group flex cursor-pointer items-start gap-3", className)}>
      <input ref={ref} id={resolvedId} type="checkbox" className="hydra-checkbox mt-0.5" {...props} />
      <span className="grid gap-0.5">
        <span className="text-sm font-semibold text-hydra-text">{label}</span>
        {description && <span className="text-xs text-hydra-muted">{description}</span>}
      </span>
    </label>
  );
});
Checkbox.displayName = "Checkbox";

export const Switch = forwardRef<HTMLInputElement, ChoiceProps>(({ label, description, className, id, ...props }, ref) => {
  const generatedId = useId();
  const resolvedId = id ?? generatedId;
  return (
    <label htmlFor={resolvedId} className={cn("flex cursor-pointer items-center justify-between gap-4", className)}>
      <span className="grid gap-0.5">
        <span className="text-sm font-semibold text-hydra-text">{label}</span>
        {description && <span className="text-xs text-hydra-muted">{description}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input ref={ref} id={resolvedId} type="checkbox" role="switch" className="hydra-switch peer sr-only" {...props} />
        <span className="h-6 w-11 rounded-full border border-hydra-line bg-hydra-surface-strong transition peer-checked:border-hydra-accent peer-checked:bg-hydra-accent/25 peer-focus-visible:ring-2 peer-focus-visible:ring-hydra-focus" />
        <span className="absolute left-1 top-1 size-4 rounded-full bg-hydra-muted shadow transition-transform peer-checked:translate-x-5 peer-checked:bg-hydra-accent" />
      </span>
    </label>
  );
});
Switch.displayName = "Switch";
