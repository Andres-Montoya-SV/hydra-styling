// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { useRef } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useFloatingSurface } from "./lib/use-floating-surface";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
it("waits for a focus-scrolling anchor to enter the viewport before allowing scroll-away dismissal", () => {
  vi.useFakeTimers();
  let top = 1800;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      return this.dataset.testid === "anchor"
        ? new DOMRect(20, top, 160, 40)
        : new DOMRect(20, 0, 200, 100);
    },
  );
  const close = vi.fn();
  function Harness() {
    const anchor = useRef<HTMLButtonElement>(null),
      surface = useRef<HTMLDivElement>(null);
    useFloatingSurface(true, anchor, surface, "bottom-start", close);
    return (
      <>
        <button ref={anchor} data-testid="anchor">
          Options
        </button>
        <div ref={surface} data-testid="surface">
          Security
        </div>
      </>
    );
  }
  render(<Harness />);
  act(() => vi.advanceTimersByTime(100));
  expect(close).not.toHaveBeenCalled();
  expect(screen.getByTestId("surface")).toHaveStyle({ visibility: "hidden" });
  top = 100;
  fireEvent.scroll(document);
  act(() => vi.advanceTimersByTime(100));
  expect(screen.getByTestId("surface")).toHaveStyle({ visibility: "visible" });
  expect(close).not.toHaveBeenCalled();
  top = -200;
  fireEvent.scroll(document);
  act(() => vi.advanceTimersByTime(100));
  expect(close).toHaveBeenCalledOnce();
});
