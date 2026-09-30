// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { ThemeProvider, ThemeToggle } from "./components/theme";
beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("hydrates from legacy storage, persists a switch, and syncs another tab", () => {
  localStorage.setItem("theme", "parchment");
  const { container } = render(
    <ThemeProvider storageKey="theme">
      <ThemeToggle />
    </ThemeProvider>,
  );
  expect(container.firstChild).toHaveAttribute("data-hydra-theme", "daylight");
  fireEvent.click(screen.getByRole("button", { name: "Use dark theme" }));
  expect(localStorage.getItem("theme")).toBe("nocturne");
  fireEvent(
    window,
    new StorageEvent("storage", { key: "theme", newValue: "light" }),
  );
  expect(container.firstChild).toHaveAttribute("data-hydra-theme", "daylight");
});
it("invalid preferences and blocked storage cannot break theme controls", () => {
  localStorage.setItem("theme", "invalid");
  const { container } = render(
    <ThemeProvider storageKey="theme">
      <ThemeToggle />
    </ThemeProvider>,
  );
  expect(container.firstChild).toHaveAttribute("data-hydra-theme", "nocturne");
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw Error("blocked");
  });
  fireEvent.click(screen.getByRole("button", { name: "Use light theme" }));
  expect(container.firstChild).toHaveAttribute("data-hydra-theme", "daylight");
});
it("server renders deterministically without accessing browser storage", () => {
  const read = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw Error("browser only");
  });
  expect(
    renderToString(
      <ThemeProvider defaultTheme="light" storageKey="theme">
        Content
      </ThemeProvider>,
    ),
  ).toContain('data-hydra-theme="daylight"');
  expect(read).not.toHaveBeenCalled();
});
