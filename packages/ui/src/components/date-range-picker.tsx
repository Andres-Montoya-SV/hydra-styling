import { forwardRef, useEffect, useId, useRef, useState, type FieldsetHTMLAttributes } from "react";
import { Button } from "./button";
import { Calendar } from "./catalog-input";
import { Field, Input } from "./field";
import { useControllable } from "./catalog-shared";
import type { ControlSize } from "./density";

export interface DateRangeValue { start: string; end: string }
export interface DateRangePickerProps extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "onChange" | "defaultValue"> {
  label: string;
  value?: DateRangeValue;
  defaultValue?: DateRangeValue;
  onValueChange?: (value: DateRangeValue) => void;
  name?: string;
  min?: string;
  max?: string;
  required?: boolean;
  readOnly?: boolean;
  locale?: string;
  controlSize?: ControlSize;
  startLabel?: string;
  endLabel?: string;
  calendarLabel?: string;
  invalidRangeMessage?: string;
}
const emptyRange: DateRangeValue = { start: "", end: "" };
export const DateRangePicker = forwardRef<HTMLFieldSetElement, DateRangePickerProps>(function DateRangePicker({
  label, value, defaultValue = emptyRange, onValueChange, name, min, max, required, disabled, readOnly,
  locale, controlSize, startLabel = "Start date", endLabel = "End date", calendarLabel = "Choose dates",
  invalidRangeMessage = "End date must be on or after start date.", className, ...props
}, ref) {
  const [range, setRange] = useControllable(value, defaultValue, onValueChange);
  const [expanded, setExpanded] = useState(false);
  const end = useRef<HTMLInputElement>(null), id = useId(), error = Boolean(range.start && range.end && range.start > range.end);
  useEffect(() => { end.current?.setCustomValidity(error ? invalidRangeMessage : ""); }, [error, invalidRangeMessage]);
  useEffect(() => {
    const form = end.current?.form;
    const reset = () => { if (value === undefined) setRange(defaultValue); setExpanded(false); };
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [value, defaultValue, setRange]);
  return <fieldset {...props} ref={ref} disabled={disabled} className={"hydra-date-range " + (className ?? "")}>
    <legend>{label}</legend>
    <div className="hydra-date-range-fields">
      <Field label={startLabel} controlSize={controlSize}><Input type="date" name={name ? name + ".start" : undefined}
        value={range.start} min={min} max={max} required={required} readOnly={readOnly}
        onChange={e => setRange({ ...range, start: e.target.value })} /></Field>
      <Field label={endLabel} controlSize={controlSize} error={error ? invalidRangeMessage : undefined}>
        <Input ref={end} type="date" name={name ? name + ".end" : undefined} value={range.end}
          min={min} max={max} required={required} readOnly={readOnly} onChange={e => setRange({ ...range, end: e.target.value })} />
      </Field>
    </div>
    <Button variant="outline" size="sm" aria-expanded={expanded} aria-controls={id}
      disabled={disabled || readOnly} onClick={() => setExpanded(!expanded)}>{calendarLabel}</Button>
    {expanded && <div className="hydra-date-range-calendars" id={id}>
      <Calendar label={startLabel} locale={locale} value={range.start} min={min} max={range.end && (!max || range.end < max) ? range.end : max}
        disabled={disabled || readOnly} onValueChange={start => setRange({ ...range, start })} />
      <Calendar label={endLabel} locale={locale} value={range.end} min={range.start && (!min || range.start > min) ? range.start : min} max={max}
        disabled={disabled || readOnly} onValueChange={end => setRange({ ...range, end })} />
    </div>}
  </fieldset>;
});
