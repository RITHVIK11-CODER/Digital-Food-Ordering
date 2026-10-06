import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "gold" | "rose" | "success" | "warning" | "error" | "outline";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "sm",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-[#242424] text-[#F6EFE7] border-[#2e2e2e]",
    secondary: "bg-[#171717] text-[#A8A29E] border-[#242424]",
    gold: "bg-[#D8B58A]/15 text-[#D8B58A] border-[#D8B58A]/30",
    rose: "bg-[#C99A8A]/15 text-[#C99A8A] border-[#C99A8A]/30",
    success: "bg-[#6FAF82]/15 text-[#6FAF82] border-[#6FAF82]/30",
    warning: "bg-[#D6A34A]/15 text-[#D6A34A] border-[#D6A34A]/30",
    error: "bg-[#C96B6B]/15 text-[#C96B6B] border-[#C96B6B]/30",
    outline: "border border-[#2e2e2e] text-[#F6EFE7]",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium rounded-full border tracking-wide select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
