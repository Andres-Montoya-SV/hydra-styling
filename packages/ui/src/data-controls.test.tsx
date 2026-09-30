// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { Combobox, MultiSelect, TagsInput, DateRangePicker, DataTable, Field, type DataColumn } from "./index";

afterEach(cleanup);
const options = [{ value: "a", label: "Alpha" }, { value: "x", label: "Disabled", disabled: true }, { value: "b", label: "Beta" }];
function focus(element: HTMLElement) { act(() => element.focus()); }
it("combobox filters, skips disabled options and submits option values rather than search text", () => {
  render(<form aria-label="Form"><Field label="Team" required><Combobox name="team" options={options} /></Field></form>);
  const input = screen.getByRole("combobox", { name: "Team" }) as HTMLInputElement;
  expect(input.checkValidity()).toBe(false);
  focus(input); fireEvent.keyDown(input, { key: "ArrowDown" });
  expect(input).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Beta" }).id);
  fireEvent.keyDown(input, { key: "Enter" });
  expect(input).toHaveValue("Beta");
  expect(input.checkValidity()).toBe(true);
  expect(new FormData(screen.getByRole("form") as HTMLFormElement).get("team")).toBe("b");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});
it("combobox Escape keeps a committed selection and controlled values remain owner-driven", () => {
  const changed = vi.fn();
  render(<Combobox label="Team" options={options} value="a" onValueChange={changed} />);
  const input = screen.getByRole("combobox");
  focus(input); fireEvent.change(input, { target: { value: "bet" } }); fireEvent.keyDown(input, { key: "Escape" });
  expect(input).toHaveValue("Alpha");
  fireEvent.keyDown(input, { key: "ArrowDown" }); fireEvent.click(screen.getByRole("option", { name: "Beta" }));
  expect(changed).toHaveBeenCalledWith("b");
  expect(input).toHaveValue("Alpha");
});
it("combobox keeps readonly values, forwards the ref, and reports loading or no matches", () => {
  const ref = createRef<HTMLInputElement>();
  const view = render(<Combobox label="Team" options={options} ref={ref} defaultValue="a" readOnly />);
  focus(ref.current!); expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  view.rerender(<Combobox label="Team" options={options} ref={ref} loading />);
  fireEvent.change(ref.current!, { target: { value: "unknown" } });
  expect(ref.current).toHaveAttribute("aria-busy", "true");
  expect(screen.getByRole("status")).toHaveTextContent("Loading options");
  view.rerender(<Combobox label="Team" options={options} ref={ref} />);
  expect(screen.getByRole("status")).toHaveTextContent("No matching options");
});
it("multiple selection enforces the limit, removes values and uses repeated form keys", () => {
  render(<form aria-label="Form"><MultiSelect label="Teams" name="team" options={options} maxSelected={1} /></form>);
  const input = screen.getByRole("combobox"); focus(input);
  fireEvent.click(screen.getByRole("option", { name: "Alpha" }));
  expect(screen.getByRole("option", { name: "Beta" })).toHaveAttribute("aria-disabled", "true");
  fireEvent.click(screen.getByRole("option", { name: "Beta" }));
  expect(new FormData(screen.getByRole("form") as HTMLFormElement).getAll("team")).toEqual(["a"]);
  fireEvent.click(screen.getByRole("button", { name: "Remove Alpha" }));
  expect(new FormData(screen.getByRole("form") as HTMLFormElement).getAll("team")).toEqual([]);
});
it("native reset restores uncontrolled selections and closes the list", () => {
  render(<form aria-label="Form"><Combobox label="Team" name="team" options={options} defaultValue="a" /></form>);
  focus(screen.getByRole("combobox")); fireEvent.click(screen.getByRole("option", { name: "Beta" }));
  fireEvent.reset(screen.getByRole("form"));
  expect(screen.getByRole("combobox")).toHaveValue("Alpha");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});
it("tags paste is atomic, deduplicates values and preserves rejected entries", () => {
  render(<form aria-label="Form"><TagsInput label="Labels" name="tag" maxTags={2} /></form>);
  const input = screen.getByRole("textbox");
  fireEvent.paste(input, { clipboardData: { getData: () => "one, one,\ntwo,three" } });
  expect(new FormData(screen.getByRole("form") as HTMLFormElement).getAll("tag")).toEqual(["one", "two"]);
  expect(input).toHaveValue("three");
  expect(input).toBeInvalid();
  expect(screen.getByRole("status")).toHaveTextContent("limit");
  fireEvent.click(screen.getByRole("button", { name: "Remove two" }));
  fireEvent.keyDown(input, { key: "Enter" });
  expect(new FormData(screen.getByRole("form") as HTMLFormElement).getAll("tag")).toEqual(["one", "three"]);
});
it("tag composition does not consume IME Enter, and backspace removes a committed tag only when empty", () => {
  render(<TagsInput label="Labels" defaultValue={["existing"]} />);
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "new" } });
  fireEvent.keyDown(input, { key: "Enter", isComposing: true });
  expect(screen.queryByRole("button", { name: "Remove new" })).not.toBeInTheDocument();
  fireEvent.keyDown(input, { key: "Enter" });
  expect(screen.getByRole("button", { name: "Remove new" })).toBeInTheDocument();
  fireEvent.keyDown(input, { key: "Backspace" });
  expect(screen.queryByRole("button", { name: "Remove new" })).not.toBeInTheDocument();
});
it("date ranges preserve invalid edits but block submission until the ordering is fixed", () => {
  render(<form aria-label="Form"><DateRangePicker label="Period" name="period" defaultValue={{ start: "2026-09-20", end: "2026-09-01" }} /></form>);
  const end = screen.getByLabelText("End date");
  expect(end).toBeInvalid();
  fireEvent.change(end, { target: { value: "2026-09-30" } });
  expect(end).toBeValid();
  const data = new FormData(screen.getByRole("form") as HTMLFormElement);
  expect(data.get("period.start")).toBe("2026-09-20"); expect(data.get("period.end")).toBe("2026-09-30");
});
it("disabled ranges cannot open calendars and do not appear in FormData", () => {
  render(<form aria-label="Form"><DateRangePicker label="Period" name="period" disabled defaultValue={{ start: "2026-01-01", end: "2026-01-31" }} /></form>);
  expect(screen.getByRole("button", { name: "Choose dates" })).toBeDisabled();
  expect([...new FormData(screen.getByRole("form") as HTMLFormElement)]).toEqual([]);
});
type Row = { id: string; score: number };
const rows: Row[] = [{ id: "b", score: 30 }, { id: "a", score: 2 }, { id: "c", score: 10 }];
const columns: DataColumn<Row>[] = [{ id: "id", header: "ID", accessor: row => row.id, rowHeader: true }, { id: "score", header: "Score", accessor: row => row.score, sortable: true }];
const getId = (row: Row) => row.id;
it("data tables sort numbers, paginate, retain selection across pages and never mutate rows", () => {
  render(<DataTable caption="Assets" rows={rows} columns={columns} getRowId={getId} pageSize={2} selectable />);
  fireEvent.click(screen.getByRole("button", { name: /Score/ }));
  expect(screen.getAllByRole("rowheader").map(e => e.textContent)).toEqual(["a", "c"]);
  fireEvent.click(screen.getByRole("checkbox", { name: "Select this page" }));
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Select b" }));
  expect(screen.getByRole("status")).toHaveTextContent("3 selected");
  fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
  expect(screen.getByRole("checkbox", { name: "Select this page" })).toBeChecked();
  expect(rows.map(row => row.id)).toEqual(["b", "a", "c"]);
});
it("server mode requests sorting and paging without slicing or sorting the supplied rows", () => {
  const sort = vi.fn(), page = vi.fn();
  render(<DataTable mode="server" caption="Remote" rows={rows} columns={columns} getRowId={getId} totalRows={50}
    page={3} pageSize={3} onPageChange={page} sorting={null} onSortingChange={sort} />);
  expect(screen.getAllByRole("rowheader").map(e => e.textContent)).toEqual(["b", "a", "c"]);
  fireEvent.click(screen.getByRole("button", { name: /Score/ }));
  expect(sort).toHaveBeenCalledWith({ columnId: "score", direction: "asc" });
  expect(page).toHaveBeenCalledWith(1);
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  expect(page).toHaveBeenCalledWith(4);
  expect(screen.getAllByRole("rowheader").map(e => e.textContent)).toEqual(["b", "a", "c"]);
});
it("selection only targets eligible rows on the current page and exposes mixed state", () => {
  render(<DataTable caption="Assets" rows={rows} columns={columns} getRowId={getId} selectable isRowSelectable={row => row.id !== "b"} />);
  expect(screen.getByRole("checkbox", { name: "Select b" })).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox", { name: "Select a" }));
  expect(screen.getByRole("checkbox", { name: "Select this page" })).toBePartiallyChecked();
  fireEvent.click(screen.getByRole("checkbox", { name: "Select this page" }));
  expect(screen.getByRole("status")).toHaveTextContent("2 selected");
});
it("loading and errors expose recovery without activating stale rows", () => {
  const retry = vi.fn();
  const view = render(<DataTable caption="Assets" rows={rows} columns={columns} getRowId={getId} loading selectable />);
  expect(screen.getByRole("group", { name: "Assets" })).toHaveAttribute("aria-busy", "true");
  expect(screen.getByRole("button", { name: /Score/ })).toBeDisabled();
  view.rerender(<DataTable caption="Assets" rows={rows} columns={columns} getRowId={getId} error="Connection failed" onRetry={retry} />);
  fireEvent.click(within(screen.getByRole("alert")).getByRole("button"));
  expect(retry).toHaveBeenCalledOnce();
  expect(screen.queryAllByRole("rowheader")).toHaveLength(0);
});
it("data components render on the server with valid initial values", () => {
  expect(renderToString(<Combobox label="Team" options={options} defaultValue="a" />)).toContain("Alpha");
  expect(renderToString(<DataTable caption="Assets" rows={rows} columns={columns} getRowId={getId} />)).toContain("<table");
});
