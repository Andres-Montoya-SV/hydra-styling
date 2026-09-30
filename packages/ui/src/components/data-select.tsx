import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState, type InputHTMLAttributes } from "react";
import { Input, useFieldControl } from "./field";
import { useControllable } from "./catalog-shared";
import { useFloatingSurface } from "../lib/use-floating-surface";
import type { ControlSize } from "./density";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}
interface PickerBase extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "size" | "type" | "children"> {
  options: SelectOption[];
  label?: string;
  controlSize?: ControlSize;
  loading?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  requiredMessage?: string;
  clearLabel?: string;
  optionsLabel?: string;
  removeLabel?: (label: string) => string;
}
export interface ComboboxProps extends PickerBase {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}
export interface MultiSelectProps extends PickerBase {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  maxSelected?: number;
}
interface PickerProps extends PickerBase {
  values?: string[];
  defaults: string[];
  onValuesChange?: (values: string[]) => void;
  multiple: boolean;
  maxSelected?: number;
}
const Picker = forwardRef<HTMLInputElement, PickerProps>(function Picker({
  options, label, values, defaults, onValuesChange, multiple, maxSelected = Infinity,
  loading = false, emptyMessage = "No matching options", loadingMessage = "Loading options",
  requiredMessage = "Choose an option from the list.", clearLabel = "Clear selection",
  optionsLabel = "Show options", removeLabel = text => "Remove " + text,
  controlSize, className, name, id, disabled, readOnly, required,
  "aria-describedby": describedBy, "aria-invalid": invalid, onFocus, onBlur, onKeyDown, ...props
}, forwardedRef) {
  const [selected, setSelected] = useControllable(values, defaults, onValuesChange);
  const [open, setOpen] = useState(false), [query, setQuery] = useState(""), [active, setActive] = useState("");
  const root = useRef<HTMLDivElement>(null), input = useRef<HTMLInputElement>(null), popup = useRef<HTMLDivElement>(null);
  const generatedId = useId(), listId = generatedId + "-options";
  const control = useFieldControl({ id, disabled, readOnly, required, controlSize, "aria-describedby": describedBy, "aria-invalid": invalid });
  const resolvedId = control.id ?? generatedId;
  const locked = control.disabled || control.readOnly;
  const filtered = options.filter(option => (option.label + " " + (option.description ?? "")).toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const unavailable = (option: SelectOption) => option.disabled || loading ||
    (multiple && selected.length >= maxSelected && !selected.includes(option.value));
  const enabled = filtered.filter(option => !unavailable(option));
  const highlighted = enabled.find(option => option.value === active) ?? enabled[0];
  const chosen = options.find(option => option.value === selected[0]);
  function close() { setOpen(false); setQuery(""); setActive(""); }
  useImperativeHandle(forwardedRef, () => input.current!);
  useFloatingSurface(open && !locked, input, popup, "bottom-start", close);
  useEffect(() => {
    input.current?.setCustomValidity(control.required && selected.length === 0 ? requiredMessage : "");
  }, [control.required, selected.length, requiredMessage]);
  useEffect(() => {
    const form = input.current?.form;
    const reset = () => { if (values === undefined) setSelected(defaults); close(); };
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [values, defaults, setSelected]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) close(); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(() => {
    // Scroll only the list. scrollIntoView can also scroll page ancestors of a
    // top-layer popover in Firefox/WebKit and move its anchor out of view.
    const surface = popup.current;
    const option = highlighted && document.getElementById(listId + "-" + options.indexOf(highlighted));
    if (!open || !surface || !option) return;
    const bounds = surface.getBoundingClientRect(), item = option.getBoundingClientRect();
    if (item.top < bounds.top) surface.scrollTop -= bounds.top - item.top;
    else if (item.bottom > bounds.bottom) surface.scrollTop += item.bottom - bounds.bottom;
  }, [open, highlighted?.value, listId, options]);
  useEffect(() => { if (locked) close(); }, [locked]);
  function choose(option: SelectOption) {
    if (locked || unavailable(option)) return;
    setSelected(multiple ? selected.includes(option.value) ? selected.filter(v => v !== option.value) : [...selected, option.value] : [option.value]);
    setQuery("");
    if (!multiple) close();
    input.current?.focus();
  }
  return <div ref={root} className={"hydra-picker " + (className ?? "")}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}>
    {label && <label className="hydra-label" htmlFor={resolvedId}>{label}</label>}
    {multiple && selected.length > 0 && <ul className="hydra-token-list" aria-label={label ?? "Selected options"}>
      {selected.map(value => {
        const text = options.find(option => option.value === value)?.label ?? value;
        return <li key={value}><span>{text}</span><button type="button" disabled={locked} aria-label={removeLabel(text)}
          onClick={() => { setSelected(selected.filter(v => v !== value)); input.current?.focus(); }}>×</button></li>;
      })}
    </ul>}
    <Input {...props} {...control} id={resolvedId} ref={input} role="combobox" autoComplete="off"
      aria-autocomplete="list" aria-expanded={open && !locked}
      aria-controls={open && !locked ? listId : undefined}
      aria-activedescendant={open && !locked && highlighted ? listId + "-" + options.indexOf(highlighted) : undefined}
      aria-busy={loading || undefined} value={open || multiple ? query : chosen?.label ?? ""}
      aria-required={control.required || undefined} required={undefined}
      onChange={event => { setQuery(event.target.value); setActive(""); setOpen(true); }}
      onFocus={event => { onFocus?.(event); if (!event.defaultPrevented && !locked) setOpen(true); }}
      onBlur={onBlur}
      onKeyDown={event => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.nativeEvent.isComposing || locked) return;
        if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          const index = enabled.findIndex(option => option.value === highlighted?.value);
          const next = !open ? (event.key === "ArrowDown" ? 0 : enabled.length - 1) :
            (index + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length;
          setActive(enabled[next]?.value ?? ""); setOpen(true);
        }
        if (event.key === "Enter" && open) { event.preventDefault(); if (highlighted) choose(highlighted); }
      }}
      trailing={<span className="hydra-picker-actions">
        {!multiple && selected.length > 0 && <button type="button" disabled={locked} aria-label={clearLabel}
          onMouseDown={e => e.preventDefault()} onClick={() => { setSelected([]); setQuery(""); input.current?.focus(); }}>×</button>}
        <button type="button" tabIndex={-1} disabled={locked} aria-label={optionsLabel}
          onMouseDown={e => e.preventDefault()} onClick={() => { input.current?.focus(); setOpen(!open); }}>⌄</button>
      </span>} />
    {name && selected.map(value => <input key={value} type="hidden" form={props.form} name={name} value={value} disabled={control.disabled} />)}
    {open && !locked && <div ref={popup} className="hydra-option-list hydra-floating-surface" id={listId}
      role="listbox" aria-label={label ?? props["aria-label"] ?? "Options"} aria-multiselectable={multiple || undefined}>
      {loading ? <div role="presentation" className="hydra-option-message">{loadingMessage}</div> :
        filtered.length ? filtered.map(option => <div role="option" key={option.value}
          id={listId + "-" + options.indexOf(option)} aria-selected={selected.includes(option.value)}
          aria-disabled={unavailable(option) || undefined} data-active={highlighted?.value === option.value || undefined}
          onPointerMove={() => { if (!unavailable(option)) setActive(option.value); }}
          onMouseDown={e => e.preventDefault()} onClick={() => choose(option)}>
          <span>{option.label}</span>{option.description && <small>{option.description}</small>}
          {selected.includes(option.value) && <span aria-hidden="true" className="hydra-option-check">✓</span>}
        </div>) : <div role="presentation" className="hydra-option-message">{emptyMessage}</div>}
    </div>}
    <span className="sr-only" role="status">{open ? loading ? loadingMessage : filtered.length === 0 ? emptyMessage : "" : ""}</span>
  </div>;
});
export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(
  ({ value, defaultValue = "", onValueChange, ...props }, ref) =>
    <Picker {...props} ref={ref} multiple={false} values={value === undefined ? undefined : value ? [value] : []}
      defaults={defaultValue ? [defaultValue] : []} onValuesChange={next => onValueChange?.(next[0] ?? "")} />,
);
Combobox.displayName = "Combobox";
export const MultiSelect = forwardRef<HTMLInputElement, MultiSelectProps>(
  ({ value, defaultValue = [], onValueChange, ...props }, ref) =>
    <Picker {...props} ref={ref} multiple values={value} defaults={defaultValue} onValuesChange={onValueChange} />,
);
MultiSelect.displayName = "MultiSelect";
