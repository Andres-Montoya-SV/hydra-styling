import { useId, type SVGProps } from "react";
import { cn } from "../lib/cn";

export interface HydraMarkProps extends SVGProps<SVGSVGElement> {
  wordmark?: boolean;
}

export function HydraMark({ wordmark = false, className, ...props }: HydraMarkProps) {
  const gradientId = useId();
  return (
    <svg viewBox={wordmark ? "0 0 250 88" : "0 0 92 88"} role="img" aria-label="Hydra Security" className={cn("h-auto", className)} {...props}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--hydra-accent)" />
          <stop offset="0.55" stopColor="var(--hydra-orange)" />
          <stop offset="1" stopColor="var(--hydra-danger)" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#${gradientId})`} strokeLinecap="round" strokeLinejoin="round">
        <path d="M46 80C24 70 24 54 34 43C43 33 42 25 36 18" strokeWidth="10" />
        <path d="M47 78C64 68 67 52 58 41C50 31 53 23 61 15" strokeWidth="10" />
        <path d="M43 78C39 61 49 52 48 40C47 28 47 21 48 12" strokeWidth="10" />
        <path d="M31 20C22 14 15 18 14 26C20 22 26 25 29 30" strokeWidth="6" />
        <path d="M49 13C43 5 35 7 33 14C40 12 44 17 46 23" strokeWidth="6" />
        <path d="M63 16C72 10 79 14 79 22C73 18 67 21 63 27" strokeWidth="6" />
      </g>
      <g fill="var(--hydra-canvas)">
        <circle cx="18" cy="22" r="1.6" /><circle cx="37" cy="12" r="1.6" /><circle cx="75" cy="18" r="1.6" />
      </g>
      {wordmark && (
        <g fill="var(--hydra-text)">
          <text x="98" y="48" fontFamily="var(--hydra-font-display)" fontSize="34" fontWeight="800">Hydra</text>
          <text x="100" y="66" fontFamily="var(--hydra-font-sans)" fontSize="10" fontWeight="700" letterSpacing="2.4">SECURITY</text>
        </g>
      )}
    </svg>
  );
}

export function FolkSun({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" {...props}>
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <circle cx="24" cy="24" r="8" fill="currentColor" />
        {[0,45,90,135].map((angle) => <path key={angle} d="M24 3V10M24 38V45" transform={`rotate(${angle} 24 24)`} />)}
      </g>
    </svg>
  );
}
