import React from "react";
import { LucideIcon, Sparkles } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl bg-[#171717]/60 border border-[#242424] max-w-md mx-auto my-6">
      <div className="w-12 h-12 rounded-full bg-[#242424] border border-[#2e2e2e] flex items-center justify-center text-[#D8B58A] mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="font-serif text-lg font-normal text-[#F6EFE7]">
        {title}
      </h4>
      <p className="text-xs text-[#A8A29E] mt-1.5 leading-relaxed max-w-xs">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          className="mt-5 text-xs"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function LoadingState({ message = "Loading handcrafted menu..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#C99A8A]/20 border-t-[#C99A8A] animate-spin" />
      </div>
      <span className="text-xs text-[#A8A29E] mt-3 font-medium tracking-wide">
        {message}
      </span>
    </div>
  );
}
