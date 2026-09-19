import { forwardRef, useEffect, useImperativeHandle, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";
import {useAnimate} from 'framer-motion';
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

export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, variant, onPointerEnter, onPointerLeave, ...props }, ref) => {
  const active=useHydraMotion();
  const [scope,animate]=useAnimate<HTMLDivElement>();
  useImperativeHandle(ref,()=>scope.current!,[scope]);
  useEffect(()=>{if(!active&&scope.current)void animate(scope.current,{y:0},{duration:0});},[active,animate,scope]);
  return <div ref={scope} className={cn(cardVariants({variant}),'hydra-card-float',className)} {...props}
    onPointerEnter={event=>{onPointerEnter?.(event);if(active&&event.pointerType==='mouse')void animate(scope.current,{y:-4},{type:'spring',stiffness:220,damping:24});}}
    onPointerLeave={event=>{onPointerLeave?.(event);if(active)void animate(scope.current,{y:0},{type:'spring',stiffness:220,damping:24});}}/>;
});
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-start justify-between gap-4 border-b border-hydra-line px-5 py-4", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("font-display text-base font-bold tracking-tight text-hydra-text", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center gap-3 border-t border-hydra-line px-5 py-4", className)} {...props} />
));
CardFooter.displayName = "CardFooter";
