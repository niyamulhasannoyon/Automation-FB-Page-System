import React from "react";
import { Card } from "@/components/common/Card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: "success" | "warning" | "danger" | "info" | "purple";
  };
  glowColor?: "blue" | "indigo" | "emerald" | "amber";
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  badge,
  glowColor = "blue",
}: StatCardProps) {
  const glowStyles = {
    blue: "from-blue-500/10 via-blue-500/5 to-transparent text-blue-400 border-blue-500/20",
    indigo: "from-indigo-500/10 via-indigo-500/5 to-transparent text-indigo-400 border-indigo-500/20",
    emerald: "from-emerald-500/10 via-emerald-500/5 to-transparent text-emerald-400 border-emerald-500/20",
    amber: "from-amber-500/10 via-amber-500/5 to-transparent text-amber-400 border-amber-500/20",
  };

  return (
    <Card className="p-5 relative group hover:border-white/20 transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 tracking-wide">
          {title}
        </span>
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br border",
            glowStyles[glowColor]
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <h4 className="text-2xl font-bold tracking-tight text-white font-mono">
          {value}
        </h4>
        {badge && (
          <span
            className={cn(
              "text-[10px] font-mono px-2 py-0.5 rounded-full border",
              badge.variant === "success" &&
                "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
              badge.variant === "warning" &&
                "bg-amber-500/10 text-amber-400 border-amber-500/20",
              badge.variant === "info" &&
                "bg-blue-500/10 text-blue-400 border-blue-500/20",
              badge.variant === "purple" &&
                "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
            )}
          >
            {badge.text}
          </span>
        )}
      </div>

      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </Card>
  );
}
