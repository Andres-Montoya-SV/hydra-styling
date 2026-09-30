import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { floatingPosition, type FloatingPlacement } from "./floating-position";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Keep the surface in its DOM/theme scope and promote it to the native top layer.
 * Older browsers get fixed positioning with the same collision calculations.
 */
export function useFloatingSurface(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  surfaceRef: RefObject<HTMLElement | null>,
  placement: FloatingPlacement,
  onAnchorHidden?: () => void,
) {
  const dismiss = useRef(onAnchorHidden);
  dismiss.current = onAnchorHidden;
  useBrowserLayoutEffect(() => {
    const anchor = anchorRef.current, surface = surfaceRef.current;
    if (!open || !anchor || !surface) return;
    const document = anchor.ownerDocument, window = document.defaultView;
    if (!window) return;
    let frame = 0;
    let promoted = false;
    if (typeof surface.showPopover === "function") {
      surface.setAttribute("popover", "manual");
      try { surface.showPopover(); promoted = true; }
      catch { surface.removeAttribute("popover"); }
    }
    surface.dataset.hydraFloating = promoted ? "top-layer" : "fixed";
    function update() {
      frame = 0;
      if (!anchor || !surface || !window) return;
      const box = anchor.getBoundingClientRect();
      const visual = window.visualViewport;
      const viewport = {
        left: visual?.offsetLeft ?? 0, top: visual?.offsetTop ?? 0,
        width: visual?.width ?? (document.documentElement.clientWidth || window.innerWidth),
        height: visual?.height ?? (document.documentElement.clientHeight || window.innerHeight),
      };
      // A scrolled-away trigger should not leave an orphaned menu at a screen edge.
      if (box.width > 0 && (box.bottom < viewport.top || box.top > viewport.top + viewport.height ||
        box.right < viewport.left || box.left > viewport.left + viewport.width)) {
        dismiss.current?.();
        return;
      }
      const limit = Math.max(0, viewport.width - 24);
      surface.style.setProperty("--hs-floating-max-width", limit + "px");
      surface.style.maxWidth = limit + "px";
      const measured = surface.getBoundingClientRect();
      // scrollHeight retains the content size when an earlier update constrained height.
      const position = floatingPosition(box, {
        width: measured.width, height: Math.max(measured.height, surface.scrollHeight + 2),
      }, viewport, placement, window.getComputedStyle(anchor).direction === "rtl");
      Object.assign(surface.style, {
        position: "fixed", inset: "auto", margin: "0", transform: "none",
        left: position.x + "px", top: position.y + "px",
        maxHeight: position.maxHeight + "px", visibility: "visible",
      });
      surface.dataset.side = position.side;
    }
    function schedule(event?: Event) {
      if (event?.target instanceof window!.Node && surface?.contains(event.target)) return;
      if (!frame) frame = window!.requestAnimationFrame(update);
    }
    update();
    document.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => schedule());
    observer?.observe(anchor);
    observer?.observe(surface);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      document.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
      if (promoted && surface.matches(":popover-open")) surface.hidePopover();
      surface.removeAttribute("popover");
    };
  }, [open, anchorRef, surfaceRef, placement]);
}
