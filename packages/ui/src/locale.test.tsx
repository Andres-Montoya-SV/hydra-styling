// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import {
  Button,
  Calendar,
  Combobox,
  DateRangePicker,
  Field,
  LocaleProvider,
  Modal,
  Pagination,
  PasswordInput,
  Tabs,
  TagsInput,
  Toast,
  useHydraLocale,
} from "./index";
afterEach(cleanup);

it("scopes messages, preserves nested overrides and resets the dictionary when the language changes", () => {
  function Label() {
    return <span>{useHydraLocale().messages.loading}</span>;
  }
  render(
    <LocaleProvider locale="es-SV" messages={{ loading: "Procesando" }}>
      <Label />
      <LocaleProvider>
        <Label />
      </LocaleProvider>
      <LocaleProvider locale="en-US">
        <Label />
      </LocaleProvider>
    </LocaleProvider>,
  );
  expect(screen.getAllByText("Procesando")).toHaveLength(2);
  expect(screen.getByText("Loading")).toBeInTheDocument();
});
it("renders deterministic Spanish server markup and an English fallback for other locales", () => {
  const html = renderToString(
    <LocaleProvider locale="es-SV">
      <Button loading>Guardar</Button>
      <Calendar defaultValue="2026-09-14" />
    </LocaleProvider>,
  );
  expect(html).toContain('lang="es-SV"');
  expect(html).toContain('dir="ltr"');
  expect(html).toContain("Cargando");
  expect(html).toContain("septiembre de 2026");
  const rtl = renderToString(
    <LocaleProvider locale="ar">
      <Button loading>Save</Button>
    </LocaleProvider>,
  );
  expect(rtl).toContain('dir="rtl"');
  expect(rtl).toContain("Loading");
});
it("component label overrides win over provider messages and validation follows language changes", () => {
  const content = (
    <>
      <Field label="Clave">
        <PasswordInput showLabel="Ver clave" />
      </Field>
      <Field label="Equipo" required>
        <Combobox options={[]} />
      </Field>
    </>
  );
  const view = render(
    <LocaleProvider locale="es-SV">{content}</LocaleProvider>,
  );
  expect(screen.getByRole("button", { name: "Ver clave" })).toBeInTheDocument();
  const combo = screen.getByRole("combobox") as HTMLInputElement;
  expect(combo.validationMessage).toBe("Elige una opción de la lista.");
  act(() => combo.focus());
  expect(screen.getByRole("status")).toHaveTextContent(
    "No hay opciones coincidentes",
  );
  view.rerender(<LocaleProvider locale="en-US">{content}</LocaleProvider>);
  expect(combo.validationMessage).toBe("Choose an option from the list.");
});
it("existing built-in tag errors change language without discarding input", () => {
  const content = (
    <TagsInput label="Labels" defaultValue={["one"]} maxTags={1} />
  );
  const view = render(
    <LocaleProvider locale="en-US">{content}</LocaleProvider>,
  );
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "two" } });
  fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
  expect(screen.getByRole("status")).toHaveTextContent(
    "The tag limit has been reached.",
  );
  view.rerender(<LocaleProvider locale="es-SV">{content}</LocaleProvider>);
  expect(screen.getByRole("status")).toHaveTextContent(
    "Se alcanzó el límite de etiquetas.",
  );
  expect(screen.getByRole("textbox")).toHaveValue("two");
});
it("localizes date-range validity, calendar navigation, pagination and dismiss labels", () => {
  render(
    <LocaleProvider locale="es-SV">
      <DateRangePicker
        label="Periodo"
        defaultValue={{ start: "2026-09-30", end: "2026-09-01" }}
      />
      <Calendar defaultValue="2026-09-14" />
      <Pagination page={2} totalPages={3} onPageChange={() => {}} />
      <Toast onDismiss={() => {}}>Listo</Toast>
      <Modal open={false} onOpenChange={() => {}} title="Revisión">
        Contenido
      </Modal>
    </LocaleProvider>,
  );
  expect(
    (screen.getByLabelText("Fecha de fin") as HTMLInputElement)
      .validationMessage,
  ).toContain("igual o posterior");
  for (const name of [
    "Mes anterior",
    "Mes siguiente",
    "Página anterior",
    "Página siguiente",
    "Descartar notificación",
  ])
    expect(screen.getByRole("button", { name })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Cerrar diálogo", hidden: true }),
  ).toBeInTheDocument();
});
it("RTL reverses horizontal tab and calendar movement while retaining Home/End behavior", () => {
  const changed = vi.fn();
  render(
    <LocaleProvider direction="rtl">
      <Tabs
        onValueChange={changed}
        items={[
          { id: "a", label: "First", content: "One" },
          { id: "b", label: "Second", content: "Two" },
        ]}
      />
      <Calendar defaultValue="2026-09-14" />
    </LocaleProvider>,
  );
  fireEvent.keyDown(screen.getByRole("tab", { name: "First" }), {
    key: "ArrowLeft",
  });
  expect(changed).toHaveBeenLastCalledWith("b");
  expect(screen.getByRole("tab", { name: "Second" })).toHaveFocus();
  fireEvent.keyDown(screen.getByRole("tab", { name: "Second" }), {
    key: "Home",
  });
  expect(changed).toHaveBeenLastCalledWith("a");
  const grid = screen.getByRole("grid");
  fireEvent.keyDown(
    within(grid).getByRole("button", { name: "Monday, September 14, 2026" }),
    { key: "ArrowLeft" },
  );
  expect(
    within(grid).getByRole("button", { name: "Tuesday, September 15, 2026" }),
  ).toHaveFocus();
});
