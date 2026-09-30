import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { VitralBackdrop } from "./vitral";

export function Divider({
  children,
  orientation = "horizontal",
  className,
}: {
  children?: ReactNode;
  orientation?: "horizontal" | "vertical";
  className?: string;
}) {
  return (
    <div
      className={cn("hydra-divider", `hydra-divider-${orientation}`, className)}
      role="separator"
      aria-orientation={orientation}
    >
      {children}
    </div>
  );
}
export function Hero({
  title,
  description,
  actions,
  artwork,
  className,
  ...props
}: Omit<HTMLAttributes<HTMLElement>, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  artwork?: ReactNode;
}) {
  return (
    <section className={cn("hydra-hero", className)} {...props}>
      <VitralBackdrop />
      <div className="hydra-hero-copy">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
        {actions && <div className="hydra-hero-actions">{actions}</div>}
      </div>
      {artwork && <div className="hydra-hero-artwork">{artwork}</div>}
    </section>
  );
}
export function Indicator({
  children,
  indicator,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { indicator: ReactNode }) {
  return (
    <div className={cn("hydra-indicator", className)} {...props}>
      {children}
      <span className="hydra-indicator-mark">{indicator}</span>
    </div>
  );
}
export function Join({
  orientation = "horizontal",
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <div
      className={cn("hydra-join", `hydra-join-${orientation}`, className)}
      {...props}
    />
  );
}
export function Mask({
  shape = "hexagon",
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  shape?: "circle" | "hexagon" | "diamond" | "squircle";
}) {
  return (
    <div
      className={cn("hydra-mask", `hydra-mask-${shape}`, className)}
      {...props}
    />
  );
}
export function Stack({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("hydra-stack", className)} {...props} />;
}
export function BrowserMockup({
  url,
  children,
  className,
}: {
  url: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("hydra-mockup hydra-browser", className)}>
      <div className="hydra-mockup-toolbar">
        <span className="hydra-window-dots" aria-hidden="true">
          ● ● ●
        </span>
        <span className="hydra-browser-url">{url}</span>
      </div>
      <div className="hydra-mockup-content">{children}</div>
    </div>
  );
}
export function CodeMockup({
  code,
  language = "text",
  caption,
  className,
}: {
  code: string;
  language?: string;
  caption?: string;
  className?: string;
}) {
  return (
    <figure className={cn("hydra-mockup hydra-code", className)}>
      <figcaption className="hydra-mockup-toolbar">
        <span>{caption ?? "Code"}</span>
        <span className="hydra-muted">{language}</span>
      </figcaption>
      <pre tabIndex={0} aria-label={caption ?? `${language} example`}>
        <code>{code}</code>
      </pre>
    </figure>
  );
}
export function PhoneMockup({
  children,
  label = "Phone preview",
  className,
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("hydra-phone", className)}
    >
      <div className="hydra-phone-camera" aria-hidden="true" />
      <div className="hydra-phone-screen">{children}</div>
      <div className="hydra-phone-home" aria-hidden="true" />
    </div>
  );
}
export function WindowMockup({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("hydra-mockup hydra-window", className)}>
      <div className="hydra-mockup-toolbar">
        <span className="hydra-window-dots" aria-hidden="true">
          ● ● ●
        </span>
        <span>{title}</span>
      </div>
      <div className="hydra-mockup-content">{children}</div>
    </div>
  );
}
