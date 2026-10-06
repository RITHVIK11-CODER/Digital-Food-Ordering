import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlightColor?: "gold" | "rose" | "success" | "warning";
}

export function AnalyticsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  highlightColor = "gold",
}: AnalyticsCardProps) {
  const colorStyles = {
    gold: "text-[#D8B58A] bg-[#D8B58A]/10 border-[#D8B58A]/20",
    rose: "text-[#C99A8A] bg-[#C99A8A]/10 border-[#C99A8A]/20",
    success: "text-[#6FAF82] bg-[#6FAF82]/10 border-[#6FAF82]/20",
    warning: "text-[#D6A34A] bg-[#D6A34A]/10 border-[#D6A34A]/20",
  };

  return (
    <div className="bg-[#171717] border border-[#242424] rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs uppercase font-medium tracking-wider text-[#A8A29E]">
            {title}
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#F6EFE7] mt-1.5 tracking-tight">
            {value}
          </h3>
        </div>

        <div className={`p-2.5 rounded-xl border ${colorStyles[highlightColor]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#242424] flex items-center justify-between text-xs">
        {subtitle && (
          <span className="text-[#A8A29E] truncate">{subtitle}</span>
        )}

        {trend && (
          <span
            className={`flex items-center gap-1 font-semibold ${
              trend.isPositive ? "text-[#6FAF82]" : "text-[#C96B6B]"
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}

