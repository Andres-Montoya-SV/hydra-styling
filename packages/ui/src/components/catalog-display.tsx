import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type DetailsHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  type TableHTMLAttributes,
} from "react";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { useHydraMotion } from "./motion";
import { clamp, useControllable } from "./catalog-shared";

export function Collapse({
  title,
  children,
  className,
  ...props
}: Omit<DetailsHTMLAttributes<HTMLDetailsElement>, "title"> & {
  title: ReactNode;
}) {
  return (
    <details className={cn("hydra-collapse", className)} {...props}>
      <summary>
        {title}
        <span aria-hidden="true">+</span>
      </summary>
      <div>{children}</div>
    </details>
  );
}
export function Accordion({
  items,
  defaultValue,
}: {
  items: { id: string; title: string; content: ReactNode }[];
  defaultValue?: string;
}) {
  const name = useId();
  return (
    <div className="hydra-accordion">
      {items.map((item) => (
        <Collapse
          name={name}
          key={item.id}
          title={item.title}
          open={item.id === defaultValue || undefined}
        >
          {item.content}
        </Collapse>
      ))}
    </div>
  );
}
export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <span className={cn("hydra-avatar", `hydra-avatar-${size}`, className)}>
      {src && !failed ? (
        <img src={src} alt={name} onError={() => setFailed(true)} />
      ) : (
        <span role="img" aria-label={name}>
          {name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((p) => p[0])
            .join("")
            .toUpperCase() || "?"}
        </span>
      )}
    </span>
  );
}
export function Aura({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("hydra-aura", className)} {...props}>
      {children}
    </div>
  );
}
export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <kbd className={cn("hydra-kbd", className)} {...props} />;
}
export function List({
  className,
  ...props
}: HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn("hydra-list", className)} {...props} />;
}
export function Table({
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div
      className="hydra-table-scroll"
      role="region"
      aria-label="Scrollable table"
      tabIndex={0}
    >
      <table className={cn("hydra-table", className)} {...props} />
    </div>
  );
}
export function Status({
  label,
  tone = "success",
}: {
  label: string;
  tone?: "success" | "info" | "warning" | "danger" | "neutral";
}) {
  return (
    <span className="hydra-status">
      <span data-tone={tone} aria-hidden="true" />
      {label}
    </span>
  );
}
export function ChatBubble({
  author,
  time,
  children,
  align = "start",
  avatar,
}: {
  author: string;
  time?: string;
  children: ReactNode;
  align?: "start" | "end";
  avatar?: ReactNode;
}) {
  return (
    <div className={cn("hydra-chat", `hydra-chat-${align}`)}>
      {avatar}
      <div>
        <div className="hydra-chat-meta">
          <strong>{author}</strong>
          {time && <span>{time}</span>}
        </div>
        <div className="hydra-chat-bubble">{children}</div>
      </div>
    </div>
  );
}
export function Countdown({
  value,
  label = "Remaining",
  digits = 2,
}: {
  value: number;
  label?: string;
  digits?: number;
}) {
  const text = Math.floor(clamp(value, 0, 999))
    .toString()
    .padStart(clamp(digits, 1, 3), "0");
  return (
    <span
      className="hydra-countdown"
      role="timer"
      aria-label={`${label}: ${text}`}
    >
      <span aria-hidden="true" key={text}>
        {text}
      </span>
      <span className="hydra-countdown-label" aria-hidden="true">
        {label}
      </span>
    </span>
  );
}
export function Timeline({
  items,
  label = "Timeline",
}: {
  items: {
    id: string;
    title: string;
    time: string;
    dateTime?: string;
    description?: ReactNode;
  }[];
  label?: string;
}) {
  return (
    <ol className="hydra-timeline" aria-label={label}>
      {items.map((item) => (
        <li key={item.id}>
          <time dateTime={item.dateTime}>{item.time}</time>
          <div>
            <strong>{item.title}</strong>
            {item.description && (
              <div className="hydra-muted">{item.description}</div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
export function Loading({
  label = "Loading",
  variant = "spinner",
}: {
  label?: string;
  variant?: "spinner" | "dots" | "bars";
}) {
  return (
    <span className="hydra-loading" role="status">
      <span aria-hidden="true" className={`hydra-loading-${variant}`}>
        <i />
        <i />
        <i />
      </span>
      <span>{label}</span>
    </span>
  );
}
export function RadialProgress({
  value,
  label = "Progress",
}: {
  value: number;
  label?: string;
}) {
  const safe = clamp(value);
  return (
    <div
      className="hydra-radial"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safe}
      style={{ "--hydra-progress": `${safe}%` } as CSSProperties}
    >
      <span>{safe}%</span>
    </div>
  );
}
export function Skeleton({
  className,
  label = "Loading content",
  ...props
}: HTMLAttributes<HTMLDivElement> & { label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("hydra-skeleton", className)}
      {...props}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

export interface GalleryItem {
  id: string;
  label: string;
  content: ReactNode;
}
export function Carousel({
  items,
  label = "Carousel",
  value,
  onValueChange,
}: {
  items: GalleryItem[];
  label?: string;
  value?: number;
  onValueChange?: (index: number) => void;
}) {
  const [index, set] = useControllable(value, 0, onValueChange),
    id = useId();
  const current = clamp(index, 0, Math.max(0, items.length - 1));
  if (!items.length) return null;
  return (
    <section
      className="hydra-carousel"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div id={id} className="hydra-carousel-slides">
        {items.map((item, i) => (
          <div
            key={item.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${items.length}: ${item.label}`}
            hidden={i !== current}
          >
            {item.content}
          </div>
        ))}
      </div>
      <div className="hydra-carousel-controls">
        <Button
          size="sm"
          variant="outline"
          aria-label="Previous slide"
          aria-controls={id}
          disabled={current === 0}
          onClick={() => set(current - 1)}
        >
          ←
        </Button>
        <p aria-live="polite">
          {items[current].label} · {current + 1}/{items.length}
        </p>
        <Button
          size="sm"
          variant="outline"
          aria-label="Next slide"
          aria-controls={id}
          disabled={current === items.length - 1}
          onClick={() => set(current + 1)}
        >
          →
        </Button>
      </div>
    </section>
  );
}
export function HoverGallery({
  items,
  label = "Gallery",
}: {
  items: GalleryItem[];
  label?: string;
}) {
  const [index, set] = useState(0),
    id = useId();
  if (!items.length) return null;
  const current = Math.min(index, items.length - 1);
  return (
    <section className="hydra-hover-gallery" aria-label={label}>
      <div id={id}>
        {items.map((item, i) => (
          <div key={item.id} hidden={current !== i}>
            {item.content}
          </div>
        ))}
      </div>
      <div className="hydra-gallery-selectors">
        {items.map((item, i) => (
          <button
            type="button"
            key={item.id}
            aria-label={item.label}
            aria-pressed={current === i}
            aria-controls={id}
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") set(i);
            }}
            onClick={() => set(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </section>
  );
}
export function HoverCard({
  className,
  style,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const active = useHydraMotion(),
    root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active) root.current?.style.removeProperty("transform");
  }, [active]);
  return (
    <div
      {...props}
      ref={root}
      className={cn("hydra-hover-card", className)}
      style={style}
      onPointerMove={(e) => {
        props.onPointerMove?.(e);
        if (!active || e.pointerType !== "mouse") return;
        const box = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - box.left) / box.width - 0.5,
          y = (e.clientY - box.top) / box.height - 0.5;
        e.currentTarget.style.transform = `perspective(900px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
      }}
      onPointerLeave={(e) => {
        props.onPointerLeave?.(e);
        e.currentTarget.style.removeProperty("transform");
      }}
    >
      {children}
    </div>
  );
}
export function Diff({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
  label = "Comparison",
}: {
  before: ReactNode;
  after: ReactNode;
  beforeLabel?: string;
  afterLabel?: string;
  label?: string;
}) {
  const [value, set] = useState(50),
    id = useId();
  return (
    <div className="hydra-diff">
      <div className="hydra-diff-stage">
        <div className="hydra-diff-layer" aria-label={afterLabel}>
          {after}
          <span className="hydra-diff-caption hydra-diff-caption-after">
            {afterLabel}
          </span>
        </div>
        <div
          className="hydra-diff-layer"
          aria-label={beforeLabel}
          style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
        >
          {before}
          <span className="hydra-diff-caption">{beforeLabel}</span>
        </div>
        <span
          className="hydra-diff-divider"
          aria-hidden="true"
          style={{ left: `${value}%` }}
        />
      </div>
      <label htmlFor={id}>
        {label} <span>{value}%</span>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
      />
    </div>
  );
}
export function TextRotate({
  items,
  interval = 4000,
  label = "Rotating text",
}: {
  items: string[];
  interval?: number;
  label?: string;
}) {
  const active = useHydraMotion(),
    [index, set] = useState(0),
    [paused, pause] = useState(false),
    [hover, setHover] = useState(false);
  useEffect(() => {
    if (!active || paused || hover || items.length < 2) return;
    const timer = window.setInterval(
      () => set((i) => (i + 1) % items.length),
      Math.max(2000, interval),
    );
    return () => window.clearInterval(timer);
  }, [active, paused, hover, interval, items.length]);
  return (
    <div
      className="hydra-text-rotate"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHover(false);
      }}
      aria-label={label}
    >
      <span key={index}>{items[index % Math.max(1, items.length)]}</span>
      {active && items.length > 1 && (
        <Button
          size="sm"
          variant="ghost"
          aria-label={paused ? "Resume rotating text" : "Pause rotating text"}
          onClick={() => pause(!paused)}
        >
          {paused ? "Resume" : "Pause"}
        </Button>
      )}
      <span className="sr-only">{items.join(". ")}</span>
    </div>
  );
}
