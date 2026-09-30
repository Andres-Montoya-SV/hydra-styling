export type FloatingPlacement = "top" | "bottom" | "top-start" | "top-end" | "bottom-start" | "bottom-end";
export type FloatingRect = { left: number; top: number; width: number; height: number };
const bound = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/** Viewport coordinates; start/end follow the trigger's writing direction. */
export function floatingPosition(
  anchor: FloatingRect,
  surface: { width: number; height: number },
  viewport: FloatingRect,
  placement: FloatingPlacement = "bottom-start",
  rtl = false,
  gap = 8,
  gutter = 12,
) {
  const left = viewport.left + gutter, top = viewport.top + gutter;
  const right = viewport.left + viewport.width - gutter;
  const bottom = viewport.top + viewport.height - gutter;
  const above = Math.max(0, anchor.top - gap - top);
  const below = Math.max(0, bottom - anchor.top - anchor.height - gap);
  let side = placement.startsWith("top") ? "top" : "bottom";
  if (side === "top" && surface.height > above && below > above) side = "bottom";
  else if (side === "bottom" && surface.height > below && above > below) side = "top";
  const maxWidth = Math.max(0, right - left);
  const maxHeight = side === "top" ? above : below;
  const width = Math.min(surface.width, maxWidth), height = Math.min(surface.height, maxHeight);
  const alignment = placement.split("-")[1];
  const alignRight = alignment === "end" ? !rtl : rtl;
  const preferredX = !alignment ? anchor.left + (anchor.width - width) / 2
    : alignRight ? anchor.left + anchor.width - width : anchor.left;
  return {
    x: bound(preferredX, left, right - width),
    y: bound(side === "top" ? anchor.top - gap - height : anchor.top + anchor.height + gap, top, bottom - height),
    maxWidth, maxHeight, side,
  };
}
