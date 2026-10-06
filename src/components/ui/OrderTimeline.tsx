"use client";

import React from "react";
import { OrderStatus } from "@/types/database.types";
import { CheckCircle, Clock, Flame, Sparkles, Utensils, CheckCheck } from "lucide-react";

interface OrderTimelineProps {
  status: OrderStatus;
  estimatedMinutes?: number;
  createdAt?: string;
}

const STEPS: { status: OrderStatus; label: string; icon: any }[] = [
  { status: "PENDING", label: "Order Placed", icon: Clock },
  { status: "ACCEPTED", label: "Accepted", icon: Sparkles },
  { status: "PREPARING", label: "In the Kitchen", icon: Flame },
  { status: "READY", label: "Ready for Pickup", icon: Utensils },
  { status: "SERVED", label: "Served", icon: CheckCircle },
  { status: "COMPLETED", label: "Completed", icon: CheckCheck },
];

export function OrderTimeline({ status, estimatedMinutes = 15 }: OrderTimelineProps) {
  const getStepIndex = (st: OrderStatus): number => {
    switch (st) {
      case "PENDING":
        return 0;
      case "ACCEPTED":
        return 1;
      case "PREPARING":
        return 2;
      case "READY":
        return 3;
      case "SERVED":
        return 4;
      case "COMPLETED":
        return 5;
      case "CANCELLED":
      case "REJECTED":
        return -1;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(status);
  const isCancelled = status === "CANCELLED" || status === "REJECTED";

  if (isCancelled) {
    return (
      <div className="bg-[#C96B6B]/10 border border-[#C96B6B]/30 rounded-2xl p-4 text-center">
        <p className="text-[#C96B6B] font-semibold text-sm">
          {status === "CANCELLED" ? "This order was cancelled" : "This order was not accepted"}
        </p>
        <p className="text-xs text-[#A8A29E] mt-1">
          Please speak to our staff if you have any questions.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#171717] border border-[#242424] rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-[#242424]">
        <div>
          <h4 className="font-serif text-base font-normal text-[#F6EFE7]">
            Culinary Timeline
          </h4>
          <p className="text-xs text-[#A8A29E] mt-0.5">
            Realtime updates directly from our barista & kitchen
          </p>
        </div>

        {currentIndex < 3 && (
          <div className="flex items-center gap-1.5 bg-[#D8B58A]/10 border border-[#D8B58A]/30 px-3 py-1 rounded-full text-xs text-[#D8B58A] font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>~{estimatedMinutes} mins</span>
          </div>
        )}
      </div>

      <div className="mt-6 relative flex flex-col space-y-6">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isUpcoming = idx > currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.status} className="relative flex items-start gap-4">
              {/* Vertical connector line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`absolute left-4 top-8 w-0.5 h-8 -ml-[1px] transition-colors duration-500 ${
                    idx < currentIndex ? "bg-[#C99A8A]" : "bg-[#242424]"
                  }`}
                />
              )}

              {/* Node Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 z-10 ${
                  isDone
                    ? "bg-[#C99A8A] border-[#C99A8A] text-[#080808]"
                    : isCurrent
                    ? "bg-[#171717] border-[#D8B58A] text-[#D8B58A] ring-4 ring-[#D8B58A]/20 scale-110"
                    : "bg-[#171717] border-[#2e2e2e] text-[#A8A29E]/40"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Step Info */}
              <div className="flex flex-col pt-1">
                <span
                  className={`text-xs font-semibold tracking-wide transition-colors ${
                    isCurrent
                      ? "text-[#D8B58A]"
                      : isDone
                      ? "text-[#F6EFE7]"
                      : "text-[#A8A29E]/40"
                  }`}
                >
                  {step.label}
                </span>

                {isCurrent && (
                  <span className="text-[11px] text-[#A8A29E] mt-0.5 font-light">
                    {step.status === "PENDING" && "Order received by kitchen desk..."}
                    {step.status === "ACCEPTED" && "Order acknowledged. In prep queue..."}
                    {step.status === "PREPARING" && "Chef is handcrafting your gourmet items..."}
                    {step.status === "READY" && "Ready! Your server is bringing your order..."}
                    {step.status === "SERVED" && "Enjoy your Velvet Bloom experience!"}
                    {step.status === "COMPLETED" && "Thank you for dining with us."}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

