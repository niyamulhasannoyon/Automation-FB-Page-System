import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info" | "purple" | "neutral";
  size?: "sm" | "md";
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className,
  ...props
}: BadgeProps) {
  const variantStyles = {
    neutral: "bg-white/5 text-slate-300 border-white/10",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    purple: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase font-mono",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full", {
          "bg-emerald-400": variant === "success",
          "bg-amber-400": variant === "warning",
          "bg-rose-400": variant === "danger",
          "bg-blue-400": variant === "info",
          "bg-indigo-400": variant === "purple",
          "bg-slate-400": variant === "neutral",
        })}
      />
      {children}
    </span>
  );
}
