import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";
import {useHydraMotion} from './motion';

const cardVariants = cva("hydra-card", {
  variants: {
    variant: {
      default: "bg-hydra-surface",
      raised: "bg-hydra-surface-strong shadow-hydra-lg",
      parchment: "hydra-parchment text-hydra-ink",
      danger: "hydra-card-danger border-hydra-danger/50 bg-hydra-danger/8",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, variant, ...props }, ref) => {
  const active=useHydraMotion();
  return <div ref={ref} className={cn(cardVariants({variant}),'hydra-card-float',className)} {...props}
    data-hydra-card-motion={active?'on':'off'}/>;
});
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("hydra-card-header flex items-start justify-between gap-4 border-b border-hydra-line", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("font-display text-base font-bold tracking-tight text-hydra-text", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("hydra-card-content", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("hydra-card-footer flex items-center gap-3 border-t border-hydra-line", className)} {...props} />
));
CardFooter.displayName = "CardFooter";
