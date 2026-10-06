"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { OrderTimeline } from "@/components/ui/OrderTimeline";
import { Order, OrderStatus } from "@/types/database.types";
import { formatCurrency, formatTime } from "@/lib/utils";
import { useRealtime } from "@/hooks/useRealtime";
import { Button } from "@/components/ui/Button";
import { LoadingState, EmptyState } from "@/components/ui/EmptyState";
import { Receipt, PlusCircle, ArrowLeft, Clock, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderIdParam = searchParams.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrder = async (id: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (err) {
      console.error("Failed to fetch order", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const id = orderIdParam || (typeof window !== "undefined" ? localStorage.getItem("vb_last_order_id") : null);
    if (id) {
      fetchOrder(id);
    } else {
      setIsLoading(false);
    }
  }, [orderIdParam]);

  // Realtime updates
  useRealtime({
    "order.accepted": (updatedOrder: Order) => {
      if (order && updatedOrder.id === order.id) {
        setOrder(updatedOrder);
        toast.info("Chef has accepted your order!");
      }
    },
    "order.preparing": (updatedOrder: Order) => {
      if (order && updatedOrder.id === order.id) {
        setOrder(updatedOrder);
        toast.info("Your order is being prepared in the kitchen!");
      }
    },
    "order.ready": (updatedOrder: Order) => {
      if (order && updatedOrder.id === order.id) {
        setOrder(updatedOrder);
        toast.success("Your culinary order is ready!");
      }
    },
    "order.served": (updatedOrder: Order) => {
      if (order && updatedOrder.id === order.id) {
        setOrder(updatedOrder);
        toast.success("Order served! Savor your meal.");
      }
    },
    "order.completed": (updatedOrder: Order) => {
      if (order && updatedOrder.id === order.id) {
        setOrder(updatedOrder);
      }
    },
    "order.additional_item_added": (updatedOrder: Order) => {
      if (order && updatedOrder.id === order.id) {
        setOrder(updatedOrder);
        toast.info("Additional items added to your order.");
      }
    },
  });

  if (isLoading) {
    return <LoadingState message="Fetching live order status..." />;
  }

  if (!order) {
    return (
      <EmptyState
        title="No Active Order Found"
        description="You haven't placed an order yet, or your session has concluded."
        actionLabel="Browse Menu"
        onAction={() => router.push("/")}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-[#A8A29E] hover:text-[#F6EFE7]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Menu</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-xs text-[#D8B58A] bg-[#171717] px-3 py-1 rounded-full border border-[#242424]">
            {order.order_number}
          </span>
          <span className="text-xs text-[#A8A29E] bg-[#171717] px-2.5 py-1 rounded-full border border-[#242424]">
            {order.table?.table_number || "Table"}
          </span>
        </div>
      </div>

      {/* Realtime Stepper Timeline */}
      <OrderTimeline
        status={order.status}
        estimatedMinutes={order.estimated_time_minutes}
        createdAt={order.created_at}
      />

      {/* Order Item List */}
      <div className="bg-[#171717] border border-[#242424] rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
          <h3 className="font-serif text-base font-normal text-[#F6EFE7]">
            Order Details
          </h3>
          <span className="text-xs text-[#A8A29E]">
            Placed at {formatTime(order.created_at)}
          </span>
        </div>

        <div className="space-y-3">
          {order.items?.map((item, idx) => (
            <div key={item.id || idx} className="flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-[#242424] text-[#D8B58A] font-bold flex items-center justify-center text-[11px] flex-shrink-0">
                  {item.quantity}×
                </span>
                <div className="flex flex-col">
                  <span className="font-medium text-[#F6EFE7]">
                    {item.item_name}
                    {item.is_additional && (
                      <span className="ml-1.5 text-[9px] uppercase font-bold text-[#D8B58A] bg-[#D8B58A]/10 px-1 py-0.5 rounded">
                        +Added
                      </span>
                    )}
                  </span>
                  {item.options && item.options.length > 0 && (
                    <div className="text-[11px] text-[#A8A29E] mt-0.5">
                      {item.options.map((o, oi) => (
                        <span key={oi} className="block">• {o.option_name}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <span className="font-mono text-[#F6EFE7]">
                {formatCurrency(item.item_total)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-[#242424] flex items-center justify-between">
          <span className="text-xs text-[#A8A29E]">Total (incl. taxes)</span>
          <span className="font-mono font-bold text-base text-[#D8B58A]">
            {formatCurrency(order.total)}
          </span>
        </div>
      </div>

      {/* Action Buttons: Add More Items or Request Bill */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/" className="w-full">
          <Button variant="outline" className="w-full text-xs h-11 gap-1.5">
            <PlusCircle className="w-3.5 h-3.5 text-[#C99A8A]" />
            <span>Add More Items</span>
          </Button>
        </Link>

        <Link href={`/bill?tableId=${order.table_id}&sessionId=${order.session_id}`} className="w-full">
          <Button variant="primary" className="w-full text-xs h-11 gap-1.5">
            <Receipt className="w-3.5 h-3.5" />
            <span>Request Bill</span>
          </Button>
        </Link>
      </div>

      {order.status === "SERVED" || order.status === "COMPLETED" ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#C99A8A]/10 to-[#D8B58A]/10 border border-[#C99A8A]/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-serif text-sm text-[#F6EFE7]">How was your dining experience?</span>
            <span className="text-xs text-[#A8A29E]">Leave a quick rating & review</span>
          </div>
          <Link href={`/feedback?orderId=${order.id}&sessionId=${order.session_id}`}>
            <Button size="sm" variant="primary" className="text-xs">
              Rate Order
            </Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col text-[#F6EFE7]">
      <CustomerHeader />
      <main className="flex-1 max-w-xl mx-auto w-full p-4 sm:p-6">
        <Suspense fallback={<LoadingState message="Loading live tracker..." />}>
          <TrackContent />
        </Suspense>
      </main>
    </div>
  );
}

