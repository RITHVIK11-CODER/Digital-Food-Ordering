"use client";

import React, { useState, useEffect } from "react";
import { Order, OrderStatus } from "@/types/database.types";
import { formatCurrency } from "@/lib/utils";
import { OrderStatusBadge } from "./StatusBadge";
import { Button } from "./Button";
import { Clock, User, AlertCircle, CheckCircle2, ChevronRight, PlusCircle, ChefHat } from "lucide-react";

interface OrderCardProps {
  order: Order;
  userRole?: "CHEF" | "WAITER" | "CASHIER" | "OWNER";
  onStatusChange?: (orderId: string, newStatus: OrderStatus, estimatedMinutes?: number) => void;
  onAddItemClick?: (order: Order) => void;
}

export function OrderCard({ order, userRole = "CHEF", onStatusChange, onAddItemClick }: OrderCardProps) {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [isActionPending, setIsActionPending] = useState(false);

  useEffect(() => {
    const calculateElapsed = () => {
      const diff = Date.now() - new Date(order.created_at).getTime();
      setElapsedMinutes(Math.floor(diff / 60000));
    };
    calculateElapsed();
    const interval = setInterval(calculateElapsed, 30000);
    return () => clearInterval(interval);
  }, [order.created_at]);

  const handleStatusChangeInternal = async (orderId: string, newStatus: OrderStatus, estimatedMinutes?: number) => {
    if (!onStatusChange || isActionPending) return;
    setIsActionPending(true);
    try {
      await onStatusChange(orderId, newStatus, estimatedMinutes);
    } finally {
      setIsActionPending(false);
    }
  };

  const isDelayed = elapsedMinutes > (order.estimated_time_minutes || 15);

  return (
    <div
      className={`relative flex flex-col bg-[#171717] border rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-lg ${
        isDelayed && !["COMPLETED", "SERVED", "READY"].includes(order.status)
          ? "border-[#C96B6B]/80 shadow-[#C96B6B]/10"
          : order.status === "READY"
          ? "border-[#6FAF82]/80 shadow-[#6FAF82]/10"
          : "border-[#242424] hover:border-[#333]"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#242424]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-base text-[#D8B58A]">
              {order.order_number}
            </span>
            <span className="bg-[#242424] text-[#F6EFE7] px-2 py-0.5 rounded-md text-xs font-semibold">
              {order.table?.table_number || "Table"}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#A8A29E]">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-[#C99A8A]" />
              {order.customer_name || "Guest"}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {elapsedMinutes}m ago
            </span>
          </div>
        </div>

        <OrderStatusBadge status={order.status} />
      </div>

      {/* Delay / Rush Warning Banner */}
      {isDelayed && !["COMPLETED", "SERVED", "READY"].includes(order.status) && (
        <div className="mt-3 flex items-center gap-2 bg-[#C96B6B]/10 border border-[#C96B6B]/30 px-3 py-1.5 rounded-lg text-xs text-[#C96B6B] font-medium">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Delayed (+{elapsedMinutes - (order.estimated_time_minutes || 15)}m over target)</span>
        </div>
      )}

      {/* Items List */}
      <div className="my-3 space-y-2.5 flex-1">
        {order.items?.map((item, idx) => (
          <div key={item.id || idx} className="flex items-start justify-between gap-2 text-xs">
            <div className="flex items-start gap-2 flex-1">
              <span className="w-5 h-5 rounded-md bg-[#242424] text-[#D8B58A] font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                {item.quantity}×
              </span>
              <div className="flex flex-col flex-1">
                <span className="font-medium text-[#F6EFE7]">
                  {item.item_name}
                  {item.is_additional && (
                    <span className="ml-1.5 text-[9px] uppercase font-bold text-[#D8B58A] bg-[#D8B58A]/10 px-1 py-0.5 rounded">
                      +Additional
                    </span>
                  )}
                </span>

                {/* Customization Details */}
                {item.options && item.options.length > 0 && (
                  <div className="text-[11px] text-[#A8A29E] mt-0.5 space-y-0.5">
                    {item.options.map((opt, oIdx) => (
                      <div key={oIdx}>
                        • {opt.group_name}: <span className="text-[#C99A8A]">{opt.option_name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Item Notes */}
                {item.special_notes && (
                  <span className="text-[10px] text-[#D6A34A] italic mt-0.5 font-sans">
                    Note: "{item.special_notes}"
                  </span>
                )}
              </div>
            </div>

            <span className="font-mono text-[#A8A29E] text-xs">
              {formatCurrency(item.item_total)}
            </span>
          </div>
        ))}
      </div>

      {/* Global Special Cooking Instructions */}
      {order.special_instructions && (
        <div className="mb-3 p-2.5 bg-[#242424]/80 border border-[#D6A34A]/40 rounded-xl text-xs text-[#D6A34A] flex items-start gap-2">
          <ChefHat className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[#D6A34A]" />
          <div>
            <span className="font-semibold block text-[10px] uppercase tracking-wider text-[#D8B58A]">
              Chef Instruction:
            </span>
            <span className="italic">{order.special_instructions}</span>
          </div>
        </div>
      )}

      {/* Footer Total and Actions */}
      <div className="pt-3 border-t border-[#242424] flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-[#A8A29E] tracking-wider">Total</span>
          <span className="font-bold text-sm text-[#F6EFE7]">
            {formatCurrency(order.total)}
          </span>
        </div>

        {/* Action Buttons based on Status and Role */}
        <div className="flex items-center gap-2">
          {onAddItemClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddItemClick(order)}
              className="gap-1 text-xs px-2.5"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#C99A8A]" />
              <span>+ Add Item</span>
            </Button>
          )}

          {userRole === "CHEF" && order.status === "PENDING" && onStatusChange && (
            <Button
              variant="primary"
              size="sm"
              disabled={isActionPending}
              onClick={() => handleStatusChangeInternal(order.id, "ACCEPTED", 15)}
              className="text-xs px-3"
            >
              {isActionPending ? "Updating..." : "Accept & Start"}
            </Button>
          )}

          {userRole === "CHEF" && order.status === "ACCEPTED" && onStatusChange && (
            <Button
              variant="primary"
              size="sm"
              disabled={isActionPending}
              onClick={() => handleStatusChangeInternal(order.id, "PREPARING")}
              className="text-xs px-3"
            >
              {isActionPending ? "Updating..." : "Start Cooking"}
            </Button>
          )}

          {userRole === "CHEF" && order.status === "PREPARING" && onStatusChange && (
            <Button
              variant="success"
              size="sm"
              disabled={isActionPending}
              onClick={() => handleStatusChangeInternal(order.id, "READY")}
              className="text-xs px-3 shadow-md"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              {isActionPending ? "Updating..." : "Mark Ready"}
            </Button>
          )}

          {userRole === "WAITER" && order.status === "READY" && onStatusChange && (
            <Button
              variant="success"
              size="sm"
              disabled={isActionPending}
              onClick={() => handleStatusChangeInternal(order.id, "SERVED")}
              className="text-xs px-3"
            >
              {isActionPending ? "Updating..." : "Mark Served"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


