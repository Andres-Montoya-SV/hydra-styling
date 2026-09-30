// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import {
  Avatar,
  Button,
  Calendar,
  Carousel,
  Dropdown,
  Filter,
  OtpInput,
  Pagination,
  Rating,
  Tabs,
  ThemeController,
  ThemeProvider,
  Toast,
  Tooltip,
  Validator,
} from "./index";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("dropdown skips disabled actions, closes on selection and returns focus", () => {
  const selected = vi.fn();
  render(
    <Dropdown
      label="Actions"
      items={[
        { id: "first", label: "First", onSelect: selected },
        {
          id: "disabled",
          label: "Unavailable",
          disabled: true,
          onSelect: selected,
        },
        { id: "last", label: "Last", onSelect: selected },
      ]}
    />,
  );
  const trigger = screen.getByRole("button", { name: "Actions" });
  fireEvent.keyDown(trigger, { key: "ArrowUp" });
  expect(screen.getByRole("menuitem", { name: "Last" })).toHaveFocus();
  fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowDown" });
  expect(screen.getByRole("menuitem", { name: "First" })).toHaveFocus();
  fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowDown" });
  expect(screen.getByRole("menuitem", { name: "Last" })).toHaveFocus();
  fireEvent.click(screen.getByRole("menuitem", { name: "Last" }));
  expect(selected).toHaveBeenCalledOnce();
  expect(trigger).toHaveFocus();
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});
it("dropdown dismisses on Escape and outside pointer input", () => {
  render(
    <>
      <Dropdown
        label="Actions"
        items={[{ id: "a", label: "Action", onSelect: () => {} }]}
      />
      <button>Outside</button>
    </>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Actions" }));
  fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
  expect(screen.getByRole("button", { name: "Actions" })).toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "Actions" }));
  fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});
it("tabs link panels, skip unavailable tabs and wrap keyboard selection", () => {
  render(
    <Tabs
      label="Details"
      items={[
        { id: "a", label: "Overview", content: "Summary" },
        { id: "b", label: "Restricted", content: "", disabled: true },
        { id: "c", label: "Evidence", content: "Certificate" },
      ]}
    />,
  );
  fireEvent.keyDown(screen.getByRole("tab", { name: "Overview" }), {
    key: "ArrowRight",
  });
  const active = screen.getByRole("tab", { name: "Evidence" });
  expect(active).toHaveFocus();
  expect(active).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tabpanel")).toHaveAttribute(
    "id",
    active.getAttribute("aria-controls"),
  );
  fireEvent.keyDown(active, { key: "ArrowRight" });
  expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
});
it("controlled tabs request changes without silently overwriting the owner value", () => {
  const change = vi.fn();
  render(
    <Tabs
      value="a"
      onValueChange={change}
      items={[
        { id: "a", label: "First", content: "A" },
        { id: "b", label: "Second", content: "B" },
      ]}
    />,
  );
  fireEvent.click(screen.getByRole("tab", { name: "Second" }));
  expect(change).toHaveBeenCalledWith("b");
  expect(screen.getByRole("tab", { name: "First" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});
it("calendar traverses leap day, respects bounds and submits a local ISO date", () => {
  function Demo() {
    const [date, set] = useState("2024-02-28");
    return (
      <form aria-label="Date form">
        <Calendar
          name="review"
          value={date}
          onValueChange={set}
          min="2024-02-28"
          max="2024-03-02"
        />
      </form>
    );
  }
  render(<Demo />);
  fireEvent.keyDown(
    screen.getByRole("button", { name: "Wednesday, February 28, 2024" }),
    { key: "ArrowRight" },
  );
  const leap = screen.getByRole("button", {
    name: "Thursday, February 29, 2024",
  });
  expect(leap).toHaveFocus();
  fireEvent.click(leap);
  expect(
    new FormData(screen.getByRole("form") as HTMLFormElement).get("review"),
  ).toBe("2024-02-29");
  fireEvent.keyDown(leap, { key: "ArrowDown" });
  expect(
    screen.getByRole("button", { name: "Saturday, March 2, 2024" }),
  ).toHaveFocus();
  expect(
    screen.getByRole("button", { name: "Sunday, March 3, 2024" }),
  ).toBeDisabled();
  expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
});
it("calendar PageUp clamps the day to the end of a shorter month", () => {
  render(<Calendar defaultValue="2025-03-31" />);
  fireEvent.keyDown(
    screen.getByRole("button", { name: "Monday, March 31, 2025" }),
    { key: "PageUp" },
  );
  expect(
    screen.getByRole("button", { name: "Friday, February 28, 2025" }),
  ).toHaveFocus();
});
it("calendar updates when a controlled date changes and gives dates localized labels", () => {
  const { rerender } = render(<Calendar value="2026-09-30" locale="es-SV" />);
  expect(screen.getByRole("grid")).toHaveAccessibleName(/septiembre/i);
  rerender(<Calendar value="2026-12-05" locale="es-SV" />);
  expect(screen.getByRole("grid")).toHaveAccessibleName(/diciembre/i);
  expect(
    screen.getByRole("button", { name: /sábado, 5 de diciembre de 2026/i })
      .parentElement,
  ).toHaveAttribute("aria-selected", "true");
});
it("OTP keeps one native field with autofill, a label and numeric constraints", () => {
  render(
    <form aria-label="Verification">
      <OtpInput
        label="Code"
        name="otp"
        length={6}
        defaultValue="123456"
        required
      />
    </form>,
  );
  const input = screen.getByRole("textbox", {
    name: "Code",
  }) as HTMLInputElement;
  expect(input).toHaveAttribute("autocomplete", "one-time-code");
  expect(input).toHaveAttribute("inputmode", "numeric");
  expect(input.checkValidity()).toBe(true);
  fireEvent.change(input, { target: { value: "123x" } });
  expect(input.checkValidity()).toBe(false);
  expect(
    new FormData(screen.getByRole("form") as HTMLFormElement).get("otp"),
  ).toBe("123x");
});
it("validator never submits invalid data and supplies FormData for a valid submission", () => {
  const submit = vi.fn();
  render(
    <Validator aria-label="Subscribe" onValidSubmit={submit}>
      <label>
        Email
        <input type="email" name="email" required />
      </label>
      <Button type="submit">Save</Button>
    </Validator>,
  );
  fireEvent.submit(screen.getByRole("form"));
  expect(submit).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "analyst@example.com" },
  });
  fireEvent.submit(screen.getByRole("form"));
  expect(submit.mock.calls[0][0].get("email")).toBe("analyst@example.com");
});
it("pagination stays bounded and compact for large datasets", () => {
  const change = vi.fn();
  const { rerender } = render(
    <Pagination page={1} totalPages={100000} onPageChange={change} />,
  );
  expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
  expect(screen.getAllByRole("button").length).toBeLessThan(8);
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  expect(change).toHaveBeenCalledWith(2);
  rerender(
    <Pagination page={100000} totalPages={100000} onPageChange={change} />,
  );
  expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
});
it("filter can be reset after choosing and rating remains a native radio group", () => {
  function Demo() {
    const [value, set] = useState("");
    return (
      <Filter
        label="Severity"
        value={value}
        onValueChange={set}
        options={[
          { value: "high", label: "High" },
          { value: "low", label: "Low" },
        ]}
      />
    );
  }
  render(
    <>
      <Demo />
      <Rating label="Quality" defaultValue={3} />
    </>,
  );
  fireEvent.click(screen.getByLabelText("High"));
  expect(screen.queryByLabelText("Low")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Reset severity" }));
  expect(screen.getByLabelText("Low")).toBeInTheDocument();
  const group = screen.getByRole("group", { name: "Quality" });
  fireEvent.click(within(group).getByRole("radio", { name: "5 of 5" }));
  expect(within(group).getByRole("radio", { name: "5 of 5" })).toBeChecked();
});
it("tooltip composes descriptions and dismisses with Escape", () => {
  render(
    <>
      <p id="hint">Existing hint</p>
      <Tooltip content="Additional help">
        <Button aria-describedby="hint">Help</Button>
      </Tooltip>
    </>,
  );
  const button = screen.getByRole("button");
  fireEvent.focus(button);
  expect(button).toHaveAccessibleDescription("Existing hint Additional help");
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  expect(button).toHaveAttribute("aria-describedby", "hint");
});
it("carousel has no autoplay and updates the visible slide when requested", () => {
  const interval = vi.spyOn(window, "setInterval");
  render(
    <Carousel
      items={[
        { id: "a", label: "First", content: "A" },
        { id: "b", label: "Second", content: "B" },
      ]}
    />,
  );
  expect(screen.getByRole("button", { name: "Previous slide" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
  expect(screen.getByRole("group")).toHaveAccessibleName("2 of 2: Second");
  expect(interval).not.toHaveBeenCalled();
});
it("avatar falls back on image error and a toast exposes a dismiss action", () => {
  const dismiss = vi.fn();
  render(
    <>
      <Avatar name="Alex Morgan" src="missing.png" />
      <Toast onDismiss={dismiss}>Saved.</Toast>
    </>,
  );
  fireEvent.error(screen.getByRole("img", { name: "Alex Morgan" }));
  expect(screen.getByRole("img", { name: "Alex Morgan" })).toHaveTextContent(
    "AM",
  );
  expect(screen.getByRole("status")).toHaveTextContent("Saved.");
  fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
  expect(dismiss).toHaveBeenCalledOnce();
});
it("theme radio controls share the enclosing provider and server-render without browser globals", () => {
  const { container } = render(
    <ThemeProvider>
      <ThemeController />
    </ThemeProvider>,
  );
  fireEvent.click(screen.getByRole("radio", { name: "Daylight" }));
  expect(container.firstChild).toHaveAttribute("data-hydra-theme", "daylight");
  expect(
    renderToString(
      <ThemeProvider>
        <Calendar defaultValue="2026-09-30" />
        <ThemeController />
        <OtpInput label="Code" />
      </ThemeProvider>,
    ),
  ).toContain("September 2026");
});
