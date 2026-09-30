import {
  Children, Fragment, createContext, forwardRef, isValidElement, useContext, useId,
  type AriaAttributes, type HTMLAttributes, type InputHTMLAttributes,
  type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from "react";
import { cn } from "../lib/cn";
import type { ControlSize } from "./density";

type FieldContextValue = {
  id: string; invalid: boolean; describedBy?: string; controlSize: ControlSize;
  disabled?: boolean; readOnly?: boolean; required?: boolean;
};
const FieldContext = createContext<FieldContextValue | null>(null);

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  optionalLabel?: ReactNode;
  /** Identity of the control, separate from the wrapper's native id. */
  controlId?: string;
  controlSize?: ControlSize;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  children: ReactNode;
}

function childControlId(children: ReactNode): string | undefined {
  const elements = Children.toArray(children).filter(isValidElement);
  if (elements.length !== 1) return undefined;
  const child = elements[0];
  const props = child.props as { id?: string; children?: ReactNode };
  if (child.type === Fragment) return childControlId(props.children);
  if (typeof child.type !== "string" || ["input", "select", "textarea"].includes(child.type))
    return props.id;
  return undefined;
}
function descriptions(...values: (string | undefined)[]) {
  return [...new Set(values.flatMap(value => value?.split(/\s+/).filter(Boolean) ?? []))].join(" ") || undefined;
}
export interface FieldControlOptions extends Pick<AriaAttributes, "aria-invalid" | "aria-describedby"> {
  id?: string;
  controlSize?: ControlSize;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
}
/** Use in composite controls so identity, errors and descriptions stay connected. */
export function useFieldControl(options: FieldControlOptions = {}) {
  const field = useContext(FieldContext);
  return {
    id: field?.id ?? options.id,
    "aria-invalid": options["aria-invalid"] ?? (field?.invalid || undefined),
    "aria-describedby": descriptions(field?.describedBy, options["aria-describedby"]),
    controlSize: options.controlSize ?? field?.controlSize ?? "md",
    disabled: options.disabled ?? field?.disabled,
    readOnly: options.readOnly ?? field?.readOnly,
    required: options.required ?? field?.required,
  };
}

export function Field({
  label, hint, error, optional, optionalLabel = "Optional", children, className,
  controlId, controlSize = "md", disabled, readOnly, required, ...props
}: FieldProps) {
  const generatedId = useId();
  const id = controlId ?? childControlId(children) ?? generatedId;
  const hintId = hint ? id + "-hint" : undefined;
  const errorId = error ? id + "-error" : undefined;
  return (
    <FieldContext.Provider value={{
      id, invalid: Boolean(error), describedBy: descriptions(hintId, errorId),
      controlSize, disabled, readOnly, required,
    }}>
      <div {...props} className={cn("hydra-field grid min-w-0", className)}>
        <label htmlFor={id} className="flex items-center justify-between text-sm font-semibold text-hydra-text">
          <span>{label}</span>
          {optional && !required && <span className="text-xs font-normal text-hydra-muted">{optionalLabel}</span>}
        </label>
        {children}
        {hint && <p id={hintId} className="text-xs text-hydra-muted">{hint}</p>}
        {error && <p id={errorId} className="text-xs text-hydra-danger">{error}</p>}
      </div>
    </FieldContext.Provider>
  );
}
function isInvalid(value: AriaAttributes["aria-invalid"]) {
  return value !== undefined && value !== false && value !== "false";
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Visual size; native numeric size keeps its HTML meaning. */
  controlSize?: ControlSize;
  inputClassName?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, inputClassName, leading, trailing, id, controlSize, disabled, readOnly, required,
    "aria-invalid": invalid, "aria-describedby": describedBy, ...props }, ref) => {
    const { controlSize: size, ...control } = useFieldControl({
      id, controlSize, disabled, readOnly, required, "aria-invalid": invalid, "aria-describedby": describedBy,
    });
    return (
      <div className={cn("hydra-control hydra-input group flex items-center gap-2", "hydra-size-" + size,
        isInvalid(control["aria-invalid"]) && "hydra-control-invalid", className)}
        data-disabled={control.disabled || undefined} data-readonly={control.readOnly || undefined}>
        {leading && <span className="shrink-0 text-hydra-accent">{leading}</span>}
        <input {...props} {...control} ref={ref} className={cn("hydra-input-element min-w-0 flex-1 bg-transparent text-hydra-text outline-none placeholder:text-hydra-muted", inputClassName)} />
        {trailing && <span className="shrink-0 text-hydra-muted">{trailing}</span>}
      </div>
    );
  },
);
Input.displayName = "Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  controlSize?: ControlSize;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, id, controlSize, disabled, readOnly, required, "aria-invalid": invalid,
    "aria-describedby": describedBy, ...props }, ref) => {
    const { controlSize: size, ...control } = useFieldControl({
      id, controlSize, disabled, readOnly, required, "aria-invalid": invalid, "aria-describedby": describedBy,
    });
    return <textarea {...props} {...control} ref={ref} className={cn(
      "hydra-control hydra-textarea resize-y bg-transparent text-hydra-text outline-none placeholder:text-hydra-muted",
      "hydra-size-" + size, isInvalid(control["aria-invalid"]) && "hydra-control-invalid", className,
    )} />;
  },
);
Textarea.displayName = "Textarea";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  controlSize?: ControlSize;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, id, controlSize, disabled, required, "aria-invalid": invalid,
    "aria-describedby": describedBy, children, ...props }, ref) => {
    const { controlSize: size, readOnly: _readOnly, ...control } = useFieldControl({
      id, controlSize, disabled, required, "aria-invalid": invalid, "aria-describedby": describedBy,
    });
    return <select {...props} {...control} ref={ref} className={cn(
      "hydra-control hydra-select w-full bg-hydra-canvas text-hydra-text outline-none", "hydra-size-" + size,
      isInvalid(control["aria-invalid"]) && "hydra-control-invalid", className,
    )}>{children}</select>;
  },
);
Select.displayName = "Select";
