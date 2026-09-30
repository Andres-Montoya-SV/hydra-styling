import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState, type InputHTMLAttributes } from "react";
import { Input, useFieldControl } from "./field";
import { useControllable } from "./catalog-shared";
import type { ControlSize } from "./density";

export interface TagsInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "size" | "type"> {
  label?: string;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  controlSize?: ControlSize;
  maxTags?: number;
  validateTag?: (tag: string) => string | undefined;
  removeLabel?: (tag: string) => string;
  limitMessage?: string;
  requiredMessage?: string;
}
export const TagsInput = forwardRef<HTMLInputElement, TagsInputProps>(function TagsInput({
  label, value, defaultValue = [], onValueChange, maxTags = 20, validateTag,
  removeLabel = tag => "Remove " + tag, limitMessage = "The tag limit has been reached.",
  requiredMessage = "Add at least one tag.", controlSize, id, name, disabled, readOnly, required,
  "aria-describedby": describedBy, "aria-invalid": invalid, onKeyDown, onPaste, className, ...props
}, forwardedRef) {
  const [tags, setTags] = useControllable(value, defaultValue, onValueChange);
  const [draft, setDraft] = useState(""), [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null), generatedId = useId();
  const control = useFieldControl({ id, disabled, readOnly, required, controlSize, "aria-describedby": describedBy, "aria-invalid": invalid });
  const locked = control.disabled || control.readOnly, errorId = generatedId + "-message";
  useImperativeHandle(forwardedRef, () => input.current!);
  useEffect(() => { input.current?.setCustomValidity(error || (control.required && tags.length === 0 ? requiredMessage : "")); }, [tags.length, control.required, requiredMessage, error]);
  useEffect(() => {
    const form = input.current?.form;
    const reset = () => { if (value === undefined) setTags(defaultValue); setDraft(""); setError(""); };
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [value, defaultValue, setTags]);
  function add(text: string) {
    if (locked) return;
    const next = [...tags], rejected: string[] = [];
    let message = "";
    for (const item of text.split(/[,\n]+/).map(t => t.trim()).filter(Boolean)) {
      if (next.includes(item)) continue;
      const problem = validateTag?.(item);
      if (problem || next.length >= maxTags) { message ||= problem ?? limitMessage; rejected.push(item); }
      else next.push(item);
    }
    if (next.length !== tags.length) setTags(next);
    setDraft(rejected.join(", ")); setError(message);
  }
  return <div className={"hydra-tags-input " + (className ?? "")}>
    {label && <label htmlFor={control.id ?? generatedId} className="hydra-label">{label}</label>}
    {tags.length > 0 && <ul className="hydra-token-list" aria-label={label ?? "Tags"}>
      {tags.map(tag => <li key={tag}><span>{tag}</span><button type="button" disabled={locked}
        aria-label={removeLabel(tag)} onClick={() => { setTags(tags.filter(t => t !== tag)); input.current?.focus(); }}>×</button></li>)}
    </ul>}
    <Input {...props} {...control} ref={input} id={control.id ?? generatedId} value={draft} required={undefined}
      aria-required={control.required || undefined}
      aria-invalid={error ? true : control["aria-invalid"]}
      aria-describedby={[control["aria-describedby"], error ? errorId : undefined].filter(Boolean).join(" ") || undefined}
      onChange={event => { setDraft(event.target.value); setError(""); }}
      onKeyDown={event => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.nativeEvent.isComposing || locked) return;
        if ((event.key === "Enter" || event.key === ",") && draft.trim()) { event.preventDefault(); add(draft); }
        else if (event.key === "Backspace" && !draft && tags.length) { event.preventDefault(); setTags(tags.slice(0, -1)); }
      }}
      onPaste={event => {
        onPaste?.(event);
        if (event.defaultPrevented || locked) return;
        const text = event.clipboardData.getData("text");
        if (/[,\n]/.test(text)) {
          event.preventDefault();
          const start = event.currentTarget.selectionStart ?? draft.length, end = event.currentTarget.selectionEnd ?? start;
          add(draft.slice(0, start) + text + draft.slice(end));
        }
      }} />
    {name && tags.map(tag => <input key={tag} type="hidden" form={props.form} name={name} value={tag} disabled={control.disabled} />)}
    <p id={errorId} role="status" className="hydra-data-error">{error}</p>
  </div>;
});
