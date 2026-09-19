import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

export const buttonVariants = cva(
  "hydra-button inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[transform,background-color,border-color,box-shadow,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hydra-focus focus-visible:ring-offset-2 focus-visible:ring-offset-hydra-canvas disabled:cursor-not-allowed disabled:opacity-45 active:translate-y-px",
  {
    variants: {
      variant: {
        primary: "hydra-button-primary text-hydra-on-accent",
        secondary: "hydra-button-secondary text-hydra-text",
        outline: "border border-hydra-line bg-transparent text-hydra-text hover:border-hydra-accent hover:text-hydra-accent",
        ghost: "bg-transparent text-hydra-muted hover:bg-hydra-surface-strong hover:text-hydra-text",
        danger: "hydra-button-danger text-white shadow-hydra-sm",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);

Button.displayName = "Button";
