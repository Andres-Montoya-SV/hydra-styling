import { useId, type CSSProperties, type SVGProps } from "react";
import { cn } from "../lib/cn";

const paneColors = [
  "var(--hs-glass-blue)",
  "var(--hs-glass-cyan)",
  "var(--hs-glass-violet)",
  "var(--hs-glass-ice)",
];

/** Original vector glasswork. No image requests, scripts, or raster textures. */
export function RoseWindow({ className, ...props }: SVGProps<SVGSVGElement>) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 480 480"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("hydra-rose-window", className)}
      {...props}
    >
      <defs>
        <radialGradient id={`${id}-light`}>
          <stop stopColor="var(--hs-glass-ice)" stopOpacity=".8" />
          <stop
            offset=".45"
            stopColor="var(--hs-glass-cyan)"
            stopOpacity=".25"
          />
          <stop offset="1" stopColor="var(--hs-glass-blue)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-pane`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="var(--hs-glass-ice)" stopOpacity=".75" />
          <stop offset="1" stopColor="var(--hs-glass-blue)" stopOpacity=".18" />
        </linearGradient>
      </defs>
      <circle cx="240" cy="240" r="238" fill={`url(#${id}-light)`} />
      <g stroke="var(--hs-lead)" strokeWidth="3" strokeLinejoin="round">
        {Array.from({ length: 16 }, (_, i) => (
          <g key={i} transform={`rotate(${i * 22.5} 240 240)`}>
            <path
              d="M240 204 225 163 240 116 255 163Z"
              fill={paneColors[i % 4]}
            />
            <path
              d="M225 163 208 105 224 57 240 116Z"
              fill={paneColors[(i + 1) % 4]}
              fillOpacity=".7"
            />
            <path
              d="M240 116 256 57 272 105 255 163Z"
              fill={paneColors[(i + 2) % 4]}
              fillOpacity=".8"
            />
            <path
              d="M224 57 225 29 240 12 255 29 256 57 240 84Z"
              fill={`url(#${id}-pane)`}
            />
            <path d="M240 13V84M224 57H256M225 163H255" strokeWidth="2" />
            <path
              d="M208 105 200 50 212 27 225 29 224 57Z"
              fill={paneColors[(i + 3) % 4]}
              fillOpacity=".45"
            />
            <circle
              cx="240"
              cy="41"
              r="7"
              fill={paneColors[(i + 1) % 4]}
              strokeWidth="2"
            />
          </g>
        ))}
        <circle cx="240" cy="240" r="35" fill="var(--hs-lead)" />
        {Array.from({ length: 8 }, (_, i) => (
          <path
            key={i}
            d="M240 237Q218 221 240 210Q262 221 240 237Z"
            transform={`rotate(${i * 45} 240 240)`}
            fill={paneColors[i % 4]}
            strokeWidth="2"
          />
        ))}
        <circle cx="240" cy="240" r="5" fill="var(--hs-glass-ice)" />
        <circle cx="240" cy="240" r="229" strokeWidth="5" />
        <circle
          cx="240"
          cy="240"
          r="236"
          stroke="var(--hs-glass-cyan)"
          strokeOpacity=".3"
          strokeWidth="1"
        />
      </g>
    </svg>
  );
}

/** Decorative architectural panes; keep these behind, never over, readable content. */
export function VitralBackdrop({ className }: { className?: string }) {
  return (
    <div className={cn("hydra-vitral-backdrop", className)} aria-hidden="true">
      <div className="hydra-vitral-aura" />
      <svg
        viewBox="0 0 1440 1000"
        preserveAspectRatio="xMidYMid slice"
        className="hydra-vitral-panes"
        focusable="false"
      >
        <g stroke="var(--hs-lead)" strokeWidth="4">
          {[
            ["0,0 390,0 208,260 0,150", 0],
            ["390,0 620,0 550,300 208,260", 2],
            ["620,0 930,0 770,205 550,300", 1],
            ["930,0 1270,0 1165,295 770,205", 0],
            ["1270,0 1440,0 1440,370 1165,295", 2],
            ["0,150 208,260 340,620 0,510", 1],
            ["208,260 550,300 340,620", 3],
            ["550,300 770,205 820,540 340,620", 0],
            ["770,205 1165,295 1050,660 820,540", 2],
            ["1165,295 1440,370 1440,770 1050,660", 1],
            ["0,510 340,620 180,1000 0,1000", 0],
            ["340,620 820,540 690,1000 180,1000", 2],
            ["820,540 1050,660 1220,1000 690,1000", 1],
            ["1050,660 1440,770 1440,1000 1220,1000", 0],
          ].map(([points, color], i) => (
            <polygon
              key={i}
              points={String(points)}
              fill={paneColors[Number(color)]}
              style={{ "--pane-index": i } as CSSProperties}
            />
          ))}
        </g>
      </svg>
      <div className="hydra-vitral-rays" />
    </div>
  );
}

export function VitralBackground() {
  return (
    <div className="hydra-vitral-background" aria-hidden="true">
      <VitralBackdrop />
    </div>
  );
}
