// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { Button, DensityProvider, Field, Input, PasswordInput, Select, Textarea, useFieldControl } from "./index";

afterEach(cleanup);
it.each(["input", "select", "textarea"] as const)("preserves explicit %s identity and label activation wiring", kind => {
  const child = kind === "input" ? <Input id="target" /> : kind === "select" ?
    <Select id="target"><option>Domain</option></Select> : <Textarea id="target" />;
  render(<Field id="field-wrapper" label="Target">{child}</Field>);
  const control = screen.getByLabelText("Target");
  expect(control.id).toBe("target");
  expect(document.querySelector("label")).toHaveAttribute("for", "target");
  expect(document.getElementById("field-wrapper")).not.toBe(control);
});
it("preserves hint, error and caller descriptions without duplicate IDs", () => {
  const { rerender } = render(<>
    <p id="policy">Approved domains only.</p>
    <Field label="Domain" controlId="domain" hint="Use a hostname." error="Domain is required.">
      <Input aria-describedby="policy domain-hint policy" />
    </Field>
  </>);
  const input = screen.getByLabelText("Domain");
  expect(input).toHaveAccessibleDescription("Use a hostname. Domain is required. Approved domains only.");
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input.getAttribute("aria-describedby")?.split(" ")).toHaveLength(3);
  rerender(<Field label="Domain" controlId="domain" hint="Use a hostname."><Input /></Field>);
  expect(screen.getByLabelText("Domain")).not.toHaveAttribute("aria-invalid");
  expect(screen.getByLabelText("Domain")).toHaveAccessibleDescription("Use a hostname.");
});
it("connects composite controls on the server without waiting for effects", () => {
  function CustomControl() {
    const { controlSize: _size, ...props } = useFieldControl();
    return <input {...props} />;
  }
  const html = renderToString(<Field controlId="custom" label="Scope" hint="Public scope"><CustomControl /></Field>);
  expect(html).toContain('for="custom"');
  expect(html).toContain('id="custom"');
  expect(html).toContain('aria-describedby="custom-hint"');
});
it("inherits field state while preserving native numeric size and form submission", () => {
  render(<form aria-label="Settings">
    <Field label="Scope" required readOnly controlSize="sm">
      <Input name="scope" defaultValue="example.com" size={24} />
    </Field>
    <Field label="Unavailable" disabled><Input name="disabled" defaultValue="excluded" /></Field>
  </form>);
  const scope = screen.getByLabelText("Scope");
  expect(scope).toBeRequired();
  expect(scope).toHaveAttribute("readonly");
  expect(scope).toHaveAttribute("size", "24");
  expect(scope.parentElement).toHaveClass("hydra-size-sm");
  expect(screen.getByLabelText("Unavailable")).toBeDisabled();
  const data = new FormData(screen.getByRole("form") as HTMLFormElement);
  expect(data.get("scope")).toBe("example.com");
  expect(data.has("disabled")).toBe(false);
});
it("keeps explicit false validity and interactive adornments accessible", () => {
  render(<Input aria-label="Search" aria-invalid="false" trailing={<button type="button">Clear</button>} />);
  expect(screen.getByRole("textbox").parentElement).not.toHaveClass("hydra-control-invalid");
  expect(screen.getByRole("button", { name: "Clear" })).toBeVisible();
});
it("forwards password refs and inherits the field size and disabled state", () => {
  const ref = createRef<HTMLInputElement>();
  render(<Field label="Secret" disabled controlSize="sm"><PasswordInput id="secret" ref={ref} /></Field>);
  expect(ref.current).toBe(screen.getByLabelText("Secret"));
  expect(ref.current).toHaveAttribute("id", "secret");
  expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
  expect(screen.getByRole("button")).toHaveClass("hydra-size-sm");
});
it("busy buttons keep their name, announce progress and suppress repeated actions", () => {
  const action = vi.fn(), ref = createRef<HTMLButtonElement>();
  const { rerender } = render(<Button ref={ref} onClick={action}>Save scope</Button>);
  fireEvent.click(ref.current!);
  rerender(<Button ref={ref} loading loadingLabel="Saving scope" onClick={action}>Save scope</Button>);
  expect(ref.current).toHaveAccessibleName("Save scope");
  expect(ref.current).toHaveAttribute("aria-busy", "true");
  expect(ref.current).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("Saving scope");
  fireEvent.click(ref.current!);
  expect(action).toHaveBeenCalledOnce();
  rerender(<Button ref={ref} onClick={action}>Save scope</Button>);
  expect(ref.current).not.toBeDisabled();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
it("supports nested density scopes without global document mutation", () => {
  const html = renderToString(<DensityProvider density="compact"><Input aria-label="Compact" />
    <DensityProvider density="comfortable"><Button>Comfortable</Button></DensityProvider>
  </DensityProvider>);
  expect(html).toContain('data-hydra-density="compact"');
  expect(html).toContain('data-hydra-density="comfortable"');
  expect(document.documentElement).not.toHaveAttribute("data-hydra-density");
});
