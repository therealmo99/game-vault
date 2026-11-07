import { type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "gold" | "complete" | "locked" | "secret";
}

export function Badge({ className, variant = "gold", children, ...props }: BadgeProps) {
  const variantClasses = {
    gold: "badge-gold",
    complete: "badge-complete",
    locked: "badge-locked",
    secret: "badge-secret",
  };

  return (
    <span className={cn("badge", variantClasses[variant], className)} {...props}>
      {children}
    </span>
  );
}