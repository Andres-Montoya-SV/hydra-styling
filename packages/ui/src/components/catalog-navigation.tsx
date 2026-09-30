import {
  useId,
  useRef,
  type AnchorHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { clamp, useControllable } from "./catalog-shared";

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  disabled?: boolean;
}
export function Link({
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={cn("hydra-link", className)} {...props} />;
}

export function Breadcrumbs({
  items,
  label = "Breadcrumb",
}: {
  items: { label: string; href?: string }[];
  label?: string;
}) {
  return (
    <nav aria-label={label}>
      <ol className="hydra-breadcrumbs">
        {items.map((item, i) => (
          <li key={i}>
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href && i < items.length - 1 ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current={i === items.length - 1 ? "page" : undefined}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Menu({
  items,
  activeId,
  label = "Menu",
  orientation = "vertical",
  className,
}: {
  items: NavigationItem[];
  activeId?: string;
  label?: string;
  orientation?: "vertical" | "horizontal";
  className?: string;
}) {
  return (
    <nav
      aria-label={label}
      className={cn("hydra-menu", `hydra-menu-${orientation}`, className)}
    >
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.disabled ? (
              <span aria-disabled="true">
                {item.icon}
                {item.label}
              </span>
            ) : (
              <a
                href={item.href}
                aria-current={activeId === item.id ? "page" : undefined}
              >
                {item.icon}
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Dock(props: Omit<Parameters<typeof Menu>[0], "orientation">) {
  return (
    <Menu
      {...props}
      orientation="horizontal"
      className={cn("hydra-dock", props.className)}
    />
  );
}
export function Navbar({
  brand,
  children,
  actions,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & { brand: ReactNode; actions?: ReactNode }) {
  return (
    <header className={cn("hydra-navbar", className)} {...props}>
      <div className="hydra-navbar-brand">{brand}</div>
      <div className="hydra-navbar-content">{children}</div>
      {actions && <div className="hydra-navbar-actions">{actions}</div>}
    </header>
  );
}

export function MegaMenu({
  label = "Explore",
  groups,
}: {
  label?: string;
  groups: { title: string; items: NavigationItem[] }[];
}) {
  const root = useRef<HTMLDetailsElement>(null);
  return (
    <details
      ref={root}
      className="hydra-megamenu"
      onKeyDown={(e) => {
        if (e.key === "Escape" && root.current) {
          root.current.open = false;
          root.current.querySelector("summary")?.focus();
        }
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget) && root.current)
          root.current.open = false;
      }}
    >
      <summary>
        {label}
        <span aria-hidden="true">⌄</span>
      </summary>
      <div className="hydra-megamenu-panel">
        {groups.map((group) => (
          <section key={group.title}>
            <h4>{group.title}</h4>
            <Menu label={group.title} items={group.items} />
          </section>
        ))}
      </div>
    </details>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  label = "Pagination",
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label?: string;
}) {
  const count = Math.max(
      1,
      Math.floor(Number.isFinite(totalPages) ? totalPages : 1),
    ),
    current = clamp(Math.floor(page), 1, count);
  const pages = [
    ...new Set(
      [1, current - 1, current, current + 1, count].filter(
        (n) => n >= 1 && n <= count,
      ),
    ),
  ].sort((a, b) => a - b);
  return (
    <nav aria-label={label} className="hydra-pagination">
      <Button
        size="sm"
        variant="outline"
        disabled={current === 1}
        aria-label="Previous page"
        onClick={() => onPageChange(current - 1)}
      >
        ‹
      </Button>
      {pages.map((n, i) => (
        <span key={n} className="hydra-pagination-item">
          {i > 0 && n - pages[i - 1] > 1 && <span aria-hidden="true">…</span>}
          <Button
            size="sm"
            variant={n === current ? "primary" : "outline"}
            aria-label={`Page ${n}`}
            aria-current={n === current ? "page" : undefined}
            onClick={() => onPageChange(n)}
          >
            {n}
          </Button>
        </span>
      ))}
      <Button
        size="sm"
        variant="outline"
        disabled={current === count}
        aria-label="Next page"
        onClick={() => onPageChange(current + 1)}
      >
        ›
      </Button>
    </nav>
  );
}

export function Steps({
  steps,
  current,
  label = "Progress steps",
}: {
  steps: string[];
  current: number;
  label?: string;
}) {
  return (
    <ol aria-label={label} className="hydra-steps">
      {steps.map((step, i) => (
        <li
          key={i}
          data-complete={i < current || undefined}
          aria-current={i === current ? "step" : undefined}
        >
          <span className="hydra-step-marker" aria-hidden="true">
            {i < current ? "✓" : i + 1}
          </span>
          <span>
            {step}
            {i < current && <span className="sr-only"> — complete</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}
export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  label = "Tabs",
}: {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: string;
}) {
  const [selected, set] = useControllable(
    value,
    defaultValue ?? items.find((i) => !i.disabled)?.id ?? "",
    onValueChange,
  );
  const id = useId();
  const active =
    items.find((i) => i.id === selected && !i.disabled)?.id ??
    items.find((i) => !i.disabled)?.id;
  const enabled = items.filter((i) => !i.disabled);
  return (
    <div className="hydra-tabs">
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={(e) => {
          const index = enabled.findIndex((i) => i.id === active);
          if (
            ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key) &&
            enabled.length
          ) {
            e.preventDefault();
            const next =
              e.key === "Home"
                ? 0
                : e.key === "End"
                  ? enabled.length - 1
                  : (index +
                      (e.key === "ArrowRight" ? 1 : -1) +
                      enabled.length) %
                    enabled.length;
            const item = enabled[next];
            set(item.id);
            document
              .getElementById(`${id}-tab-${items.indexOf(item)}`)
              ?.focus();
          }
        }}
      >
        {items.map((item, i) => (
          <button
            type="button"
            role="tab"
            key={item.id}
            id={`${id}-tab-${i}`}
            aria-controls={`${id}-panel-${i}`}
            aria-selected={active === item.id}
            disabled={item.disabled}
            tabIndex={active === item.id ? 0 : -1}
            onClick={() => set(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item, i) => (
        <div
          role="tabpanel"
          key={item.id}
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          hidden={active !== item.id}
          tabIndex={0}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
