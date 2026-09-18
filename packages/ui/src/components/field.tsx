import { createContext, forwardRef, useContext, useId, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type FieldContextValue = { id: string; invalid: boolean; describedBy?: string };
const FieldContext = createContext<FieldContextValue | null>(null);

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}

export function Field({ label, hint, error, optional, children, className, ...props }: FieldProps) {
  const id = useId();
  const descriptionId = hint || error ? `${id}-description` : undefined;
  return (
    <FieldContext.Provider value={{ id, invalid: Boolean(error), describedBy: descriptionId }}>
      <div className={cn("grid gap-2", className)} {...props}>
        <label htmlFor={id} className="flex items-center justify-between text-sm font-semibold text-hydra-text">
          <span>{label}</span>
          {optional && <span className="text-xs font-normal text-hydra-muted">Optional</span>}
        </label>
        {children}
        {(error || hint) && (
          <p id={descriptionId} className={cn("text-xs", error ? "text-hydra-danger" : "text-hydra-muted")}>
            {error ?? hint}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { leading?: ReactNode; trailing?: ReactNode };

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, leading, trailing, id, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy, ...props }, ref) => {
    const field = useContext(FieldContext);
    const invalid = ariaInvalid ?? field?.invalid;
    return (
      <div className={cn("hydra-control group flex items-center gap-2", invalid && "hydra-control-invalid", className)}>
        {leading && <span className="shrink-0 text-hydra-accent" aria-hidden="true">{leading}</span>}
        <input
          ref={ref}
          id={id ?? field?.id}
          aria-invalid={invalid || undefined}
          aria-describedby={ariaDescribedBy ?? field?.describedBy}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-hydra-text outline-none placeholder:text-hydra-muted/70"
          {...props}
        />
        {trailing && <span className="shrink-0 text-hydra-muted" aria-hidden="true">{trailing}</span>}
      </div>
    );
  },
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, id, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy, ...props }, ref) => {
    const field = useContext(FieldContext);
    const invalid = ariaInvalid ?? field?.invalid;
    return (
      <textarea
        ref={ref}
        id={id ?? field?.id}
        aria-invalid={invalid || undefined}
        aria-describedby={ariaDescribedBy ?? field?.describedBy}
        className={cn("hydra-control min-h-28 resize-y bg-transparent px-3.5 py-3 text-sm text-hydra-text outline-none placeholder:text-hydra-muted/70", invalid && "hydra-control-invalid", className)}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, id, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy, children, ...props }, ref) => {
    const field = useContext(FieldContext);
    const invalid = ariaInvalid ?? field?.invalid;
    return (
      <select
        ref={ref}
        id={id ?? field?.id}
        aria-invalid={invalid || undefined}
        aria-describedby={ariaDescribedBy ?? field?.describedBy}
        className={cn("hydra-control h-10 w-full appearance-none bg-hydra-canvas px-3.5 text-sm text-hydra-text outline-none", invalid && "hydra-control-invalid", className)}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";
