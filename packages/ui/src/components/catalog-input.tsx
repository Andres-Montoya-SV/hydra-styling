import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FieldsetHTMLAttributes,
  type FormHTMLAttributes,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { useHydraTheme } from "./theme";
import { clamp, useControllable } from "./catalog-shared";

export function Fieldset({
  legend,
  description,
  children,
  className,
  ...props
}: FieldsetHTMLAttributes<HTMLFieldSetElement> & {
  legend: string;
  description?: string;
}) {
  const id = useId();
  return (
    <fieldset
      className={cn("hydra-fieldset", className)}
      aria-describedby={description ? id : undefined}
      {...props}
    >
      <legend>{legend}</legend>
      {description && (
        <p id={id} className="hydra-muted">
          {description}
        </p>
      )}
      {children}
    </fieldset>
  );
}
export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("hydra-label", className)} {...props} />;
}
export const Radio = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string }
>(({ label, className, ...props }, ref) => (
  <label className={cn("hydra-radio", className)}>
    <input ref={ref} type="radio" {...props} />
    <span>{label}</span>
  </label>
));
Radio.displayName = "Radio";

export function Filter({
  options,
  value,
  onValueChange,
  label = "Filter",
}: {
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
}) {
  const name = useId();
  return (
    <fieldset className="hydra-filter">
      <legend>{label}</legend>
      <div>
        {options
          .filter((option) => !value || option.value === value)
          .map((option) => (
            <label key={option.value}>
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onValueChange(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        {value && (
          <Button size="sm" variant="outline" onClick={() => onValueChange("")}>
            Reset {label.toLowerCase()}
          </Button>
        )}
      </div>
    </fieldset>
  );
}
export function Rating({
  label,
  value,
  defaultValue = 0,
  onValueChange,
  max = 5,
  disabled = false,
  name,
}: {
  label: string;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  max?: number;
  disabled?: boolean;
  name?: string;
}) {
  const [current, set] = useControllable(value, defaultValue, onValueChange),
    id = useId();
  const count = Math.floor(clamp(max, 1, 10));
  return (
    <fieldset disabled={disabled} className="hydra-rating">
      <legend>{label}</legend>
      <div>
        {Array.from({ length: count }, (_, i) => (
          <label key={i}>
            <input
              type="radio"
              name={name ?? id}
              value={i + 1}
              checked={current === i + 1}
              onChange={() => set(i + 1)}
            />
            <span aria-hidden="true" data-filled={i < current || undefined}>
              ★
            </span>
            <span className="sr-only">
              {i + 1} of {count}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
export const OtpInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
    length?: number;
    label: string;
  }
>(({ length = 6, label, className, ...props }, ref) => {
  const size = Math.floor(clamp(length, 1, 12)),
    id = useId();
  return (
    <label
      className={cn("hydra-otp-label", className)}
      htmlFor={props.id ?? id}
    >
      <span>{label}</span>
      <input
        ref={ref}
        id={id}
        aria-label={label}
        type="text"
        autoComplete="one-time-code"
        inputMode="numeric"
        pattern={`[0-9]{${size}}`}
        maxLength={size}
        className="hydra-otp"
        style={{ "--hydra-otp-length": size } as CSSProperties}
        {...props}
      />
    </label>
  );
});
OtpInput.displayName = "OtpInput";

/** Uses browser constraints and leaves server-side validation to the consumer. */
export function Validator({
  children,
  onValidSubmit,
  className,
  ...props
}: Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  onValidSubmit: (data: FormData) => void;
  children: ReactNode;
}) {
  const [attempted, setAttempted] = useState(false);
  return (
    <form
      {...props}
      className={cn(
        "hydra-validator",
        attempted && "hydra-validator-attempted",
        className,
      )}
      onInvalid={() => setAttempted(true)}
      onReset={(e) => {
        setAttempted(false);
        props.onReset?.(e);
      }}
      onSubmit={(e) => {
        e.preventDefault();
        setAttempted(true);
        if (e.currentTarget.checkValidity())
          onValidSubmit(new FormData(e.currentTarget));
      }}
    >
      {children}
    </form>
  );
}
export function Swap({
  label,
  on,
  off,
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled,
}: {
  label: string;
  on: ReactNode;
  off: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const [active, set] = useControllable(
    checked,
    defaultChecked,
    onCheckedChange,
  );
  return (
    <Button
      variant="outline"
      className="hydra-swap"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={() => set(!active)}
    >
      <span aria-hidden="true" key={String(active)}>
        {active ? on : off}
      </span>
    </Button>
  );
}
export function ThemeController({ label = "Color theme" }: { label?: string }) {
  const { theme, setTheme } = useHydraTheme(),
    id = useId();
  return (
    <fieldset className="hydra-theme-controller">
      <legend>{label}</legend>
      <Radio
        name={id}
        label="Nocturne"
        value="nocturne"
        checked={theme === "nocturne"}
        onChange={() => setTheme("nocturne")}
      />
      <Radio
        name={id}
        label="Daylight"
        value="daylight"
        checked={theme === "daylight"}
        onChange={() => setTheme("daylight")}
      />
    </fieldset>
  );
}

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
function parseDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && isoDate(date) === value
    ? date
    : undefined;
}
function shiftDate(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
function monthStart(date: Date) {
  const next = new Date(date);
  next.setUTCDate(1);
  return next;
}
function shiftMonth(date: Date, delta: number) {
  const next = monthStart(date);
  next.setUTCMonth(next.getUTCMonth() + delta);
  const end = new Date(next);
  end.setUTCMonth(end.getUTCMonth() + 1);
  end.setUTCDate(0);
  next.setUTCDate(Math.min(date.getUTCDate(), end.getUTCDate()));
  return next;
}

export interface CalendarProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (date: string) => void;
  min?: string;
  max?: string;
  label?: string;
  locale?: string;
  name?: string;
  disabled?: boolean;
}
/** Single ISO date picker. Arrow keys move days; Home/End move within a week; PageUp/Down change month. */
export function Calendar({
  value,
  defaultValue = "",
  onValueChange,
  min,
  max,
  label = "Choose date",
  locale = "en-US",
  name,
  disabled,
}: CalendarProps) {
  const [selected, setSelected] = useControllable(
    value,
    defaultValue,
    onValueChange,
  );
  const minimum = parseDate(min),
    maximum = parseDate(max);
  function bounded(date: Date) {
    return minimum && date < minimum
      ? minimum
      : maximum && date > maximum
        ? maximum
        : date;
  }
  const [focusDate, setFocus] = useState(() =>
    isoDate(bounded(parseDate(selected) ?? new Date())),
  );
  const [month, setMonth] = useState(() => monthStart(parseDate(focusDate)!));
  const shouldFocus = useRef(false),
    root = useRef<HTMLDivElement>(null),
    id = useId();
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
    [locale],
  );
  const dayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" }),
    [locale],
  );
  const weekdayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }),
    [locale],
  );
  useEffect(() => {
    const date = parseDate(value);
    if (date) {
      setFocus(isoDate(date));
      setMonth(monthStart(date));
    }
  }, [value]);
  useEffect(() => {
    if (shouldFocus.current) {
      root.current
        ?.querySelector<HTMLButtonElement>(`[data-date="${focusDate}"]`)
        ?.focus();
      shouldFocus.current = false;
    }
  }, [focusDate, month]);
  const start = shiftDate(month, -month.getUTCDay());
  const days = Array.from({ length: 42 }, (_, i) => shiftDate(start, i));
  const allowed = (date: Date) =>
    !disabled && !(minimum && date < minimum) && !(maximum && date > maximum);
  const visibleFocus =
    days.find((d) => isoDate(d) === focusDate && allowed(d)) ??
    days.find((d) => d.getUTCMonth() === month.getUTCMonth() && allowed(d));
  const previous = shiftMonth(month, -1),
    next = shiftMonth(month, 1);
  function move(date: Date) {
    const target = bounded(date);
    shouldFocus.current = true;
    setFocus(isoDate(target));
    setMonth(monthStart(target));
  }
  return (
    <div ref={root} className="hydra-calendar" role="group" aria-label={label}>
      {name && (
        <input type="hidden" name={name} value={selected} disabled={disabled} />
      )}
      <div className="hydra-calendar-heading">
        <Button
          size="sm"
          variant="ghost"
          aria-label="Previous month"
          disabled={
            disabled || Boolean(minimum && shiftDate(month, -1) < minimum)
          }
          onClick={() => {
            setMonth(previous);
            setFocus(isoDate(bounded(previous)));
          }}
        >
          ‹
        </Button>
        <strong id={id} aria-live="polite">
          {formatter.format(month)}
        </strong>
        <Button
          size="sm"
          variant="ghost"
          aria-label="Next month"
          disabled={disabled || Boolean(maximum && next > maximum)}
          onClick={() => {
            setMonth(next);
            setFocus(isoDate(bounded(next)));
          }}
        >
          ›
        </Button>
      </div>
      <table role="grid" aria-labelledby={id}>
        <thead>
          <tr>
            {Array.from({ length: 7 }, (_, i) => (
              <th key={i} scope="col">
                {weekdayFormatter.format(new Date(Date.UTC(2026, 0, 4 + i)))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, week) => (
            <tr key={week}>
              {days.slice(week * 7, week * 7 + 7).map((date) => {
                const iso = isoDate(date);
                return (
                  <td key={iso} aria-selected={selected === iso}>
                    <button
                      type="button"
                      data-date={iso}
                      data-outside={
                        date.getUTCMonth() !== month.getUTCMonth() || undefined
                      }
                      disabled={!allowed(date)}
                      tabIndex={
                        visibleFocus && isoDate(visibleFocus) === iso ? 0 : -1
                      }
                      aria-label={dayFormatter.format(date)}
                      aria-current={
                        iso === isoDate(new Date()) ? "date" : undefined
                      }
                      onClick={() => {
                        setSelected(iso);
                        setFocus(iso);
                        setMonth(monthStart(date));
                      }}
                      onKeyDown={(e) => {
                        const offsets: Record<string, number> = {
                          ArrowLeft: -1,
                          ArrowRight: 1,
                          ArrowUp: -7,
                          ArrowDown: 7,
                          Home: -date.getUTCDay(),
                          End: 6 - date.getUTCDay(),
                        };
                        if (e.key in offsets) {
                          e.preventDefault();
                          move(shiftDate(date, offsets[e.key]));
                        } else if (e.key === "PageUp" || e.key === "PageDown") {
                          e.preventDefault();
                          move(
                            shiftMonth(
                              date,
                              (e.key === "PageUp" ? -1 : 1) *
                                (e.shiftKey ? 12 : 1),
                            ),
                          );
                        }
                      }}
                    >
                      {date.getUTCDate()}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
