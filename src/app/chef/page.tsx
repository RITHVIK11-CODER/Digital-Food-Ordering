"use client";

import React, { useState, useEffect } from "react";
import { StaffHeader } from "@/components/layout/StaffHeader";
import { OrderCard } from "@/components/ui/OrderCard";
import { Order, OrderStatus } from "@/types/database.types";
import { useRealtime } from "@/hooks/useRealtime";
import { LoadingState } from "@/components/ui/EmptyState";
import { Volume2, VolumeX, Flame, Clock, CheckCircle2, AlertTriangle, ChefHat } from "lucide-react";
import { toast } from "sonner";

export default function ChefDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "PREPARING" | "READY" | "ALL">("ACTIVE");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to load kitchen orders", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880.0, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch {}
  };

  // Realtime Kitchen Stream
  useRealtime({
    "order.created": (newOrder: Order) => {
      setOrders((prev) => [newOrder, ...prev]);
      playChime();
      toast.info(`🔔 New Order received: #${newOrder.order_number} (${newOrder.table?.table_number || "Table"})`, {
        duration: 5000,
      });
    },
    "order.additional_item_added": (updatedOrder: Order) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
      playChime();
      toast.warning(`⚠️ Additional item added to order #${updatedOrder.order_number}!`);
    },
    "order.accepted": (updatedOrder: Order) => {
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    },
    "order.preparing": (updatedOrder: Order) => {
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    },
    "order.ready": (updatedOrder: Order) => {
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    },
    "order.served": (updatedOrder: Order) => {
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    },
  });

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus, estimatedMinutes?: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          actorType: "CHEF",
          estimatedMinutes,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
        toast.success(`Order #${updated.order_number} status updated to ${newStatus}`);
      }
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  // Metrics
  const pendingOrders = orders.filter((o) => o.status === "PENDING" || o.status === "ACCEPTED");
  const preparingOrders = orders.filter((o) => o.status === "PREPARING");
  const readyOrders = orders.filter((o) => o.status === "READY");
  const activeOrders = orders.filter((o) => ["PENDING", "ACCEPTED", "PREPARING", "READY"].includes(o.status));

  const filteredOrders =
    activeTab === "ACTIVE"
      ? activeOrders
      : activeTab === "PREPARING"
      ? preparingOrders
      : activeTab === "READY"
      ? readyOrders
      : orders;

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col text-[#F6EFE7]">
      <StaffHeader
        role="CHEF"
        staffName="Chef Marcus Chen"
        onRefresh={fetchOrders}
        activeOrdersCount={activeOrders.length}
      />

      {/* Kitchen Load Bar */}
      <section className="bg-[#171717] border-b border-[#242424] px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-[#D8B58A]" />
              <span className="font-serif text-lg font-normal text-[#F6EFE7]">
                Kitchen Display System (KDS)
              </span>
            </div>

            {/* Quick Stats */}
            <div className="hidden sm:flex items-center gap-3 text-xs">
              <div className="bg-[#242424] px-3 py-1 rounded-lg border border-[#2e2e2e]">
                <span className="text-[#A8A29E]">Queue: </span>
                <span className="font-bold text-[#D6A34A]">{pendingOrders.length}</span>
              </div>
              <div className="bg-[#242424] px-3 py-1 rounded-lg border border-[#2e2e2e]">
                <span className="text-[#A8A29E]">Cooking: </span>
                <span className="font-bold text-[#C99A8A]">{preparingOrders.length}</span>
              </div>
              <div className="bg-[#242424] px-3 py-1 rounded-lg border border-[#2e2e2e]">
                <span className="text-[#A8A29E]">Ready: </span>
                <span className="font-bold text-[#6FAF82]">{readyOrders.length}</span>
              </div>
            </div>
          </div>

          {/* Audio Chime and Station Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                soundEnabled
                  ? "bg-[#6FAF82]/15 border-[#6FAF82]/30 text-[#6FAF82]"
                  : "bg-[#242424] border-[#2e2e2e] text-[#A8A29E]"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? "Audio Alert: ON" : "Audio Alert: MUTE"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="px-4 sm:px-6 pt-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 border-b border-[#242424] pb-3">
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "ACTIVE"
                ? "bg-[#D8B58A] text-[#080808]"
                : "bg-[#171717] text-[#A8A29E] hover:text-[#F6EFE7]"
            }`}
          >
            Active Tickets ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("PREPARING")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "PREPARING"
                ? "bg-[#C99A8A] text-[#080808]"
                : "bg-[#171717] text-[#A8A29E] hover:text-[#F6EFE7]"
            }`}
          >
            In Prep ({preparingOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("READY")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "READY"
                ? "bg-[#6FAF82] text-[#080808]"
                : "bg-[#171717] text-[#A8A29E] hover:text-[#F6EFE7]"
            }`}
          >
            Ready for Pickup ({readyOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "ALL"
                ? "bg-[#242424] text-[#F6EFE7]"
                : "bg-[#171717] text-[#A8A29E] hover:text-[#F6EFE7]"
            }`}
          >
            All History ({orders.length})
          </button>
        </div>
      </div>

      {/* Order Cards Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6">
        {isLoading ? (
          <LoadingState message="Connecting to Kitchen Display System..." />
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center text-[#A8A29E]">
            <ChefHat className="w-12 h-12 mx-auto text-[#2e2e2e] mb-3" />
            <p className="font-serif text-lg text-[#F6EFE7]">Kitchen Queue Clear</p>
            <p className="text-xs mt-1">No orders currently pending in this section.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                userRole="CHEF"
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
