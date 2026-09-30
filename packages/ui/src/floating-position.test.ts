import { expect, it } from "vitest";
import { floatingPosition } from "./lib/floating-position";

const viewport = { left: 0, top: 0, width: 390, height: 844 };
it("flips above a trigger near the bottom and clamps to the right edge", () => {
  const result = floatingPosition({ left: 330, top: 790, width: 48, height: 32 }, { width: 240, height: 180 }, viewport);
  expect(result.side).toBe("top");
  expect(result.x).toBe(138);
  expect(result.y).toBe(602);
});
it("uses the side with more space and bounds oversized content", () => {
  const result = floatingPosition({ left: 100, top: 400, width: 100, height: 60 }, { width: 800, height: 1000 }, viewport);
  expect(result.maxWidth).toBe(366);
  expect(result.x).toBe(12);
  expect(result.side).toBe("top");
  expect(result.maxHeight).toBe(380);
  expect(result.y).toBe(12);
});
it("honors logical alignment in right-to-left layouts", () => {
  const anchor = { left: 100, top: 100, width: 100, height: 40 };
  const size = { width: 150, height: 100 };
  expect(floatingPosition(anchor, size, viewport, "bottom-start", true).x).toBe(50);
  expect(floatingPosition(anchor, size, viewport, "bottom-end", true).x).toBe(100);
});
it("accounts for an offset visual viewport after zoom or an on-screen keyboard", () => {
  const visual = { left: 80, top: 120, width: 220, height: 360 };
  const result = floatingPosition({ left: 90, top: 130, width: 70, height: 30 }, { width: 180, height: 100 }, visual, "top");
  expect(result.side).toBe("bottom");
  expect(result.x).toBeGreaterThanOrEqual(92);
  expect(result.x + 180).toBeLessThanOrEqual(288);
  expect(result.y).toBe(168);
});
