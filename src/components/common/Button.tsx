import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary:
      "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 border border-blue-500/30",
    secondary:
      "bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 hover:border-white/20",
    danger:
      "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 hover:border-rose-500/40",
    ghost: "bg-transparent hover:bg-white/5 text-slate-300 hover:text-white border-transparent",
    outline:
      "bg-transparent border border-white/15 hover:border-white/30 text-slate-200 hover:bg-white/5",
  };

  const sizeStyles = {
    sm: "px-2.5 py-1.5 text-xs font-medium rounded-lg gap-1.5",
    md: "px-4 py-2 text-sm font-medium rounded-xl gap-2",
    lg: "px-5 py-2.5 text-base font-semibold rounded-xl gap-2.5",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
}
