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
      const res = await fetch("/api/orders", { cache: "no-store" });
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

  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  // Initialize or resume Web Audio API context
  const getOrInitAudioContext = () => {
    try {
      let ctx = audioCtx;
      if (!ctx || ctx.state === "closed") {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioCtx(ctx);
      }
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      return ctx;
    } catch {
      return null;
    }
  };

  const playChime = (type: "NEW_ORDER" | "ADDITIONAL_ITEM" = "NEW_ORDER") => {
    if (!soundEnabled) return;
    try {
      const ctx = getOrInitAudioContext();
      if (!ctx) return;

      if (type === "NEW_ORDER") {
        // Harmonic luxury 3-tone ascending chord
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
          gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + idx * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.12);
          osc.stop(ctx.currentTime + idx * 0.12 + 0.6);
        });
      } else {
        // Alert double-ping
        [880.0, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);
          gain.gain.setValueAtTime(0.35, ctx.currentTime + idx * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.15);
          osc.stop(ctx.currentTime + idx * 0.15 + 0.4);
        });
      }
    } catch (err) {
      console.warn("Audio chime playback error:", err);
    }
  };

  const handleTestChime = () => {
    getOrInitAudioContext();
    playChime("NEW_ORDER");
    toast.success("🎵 Audio alert test chime played.");
  };

  // Realtime Kitchen Stream
  useRealtime(
    {
      "order.created": (newOrder: Order) => {
        fetchOrders();
        playChime("NEW_ORDER");
        toast.info(`🔔 New Order received: #${newOrder?.order_number || "New"}`, {
          duration: 6000,
        });
      },
      "order.additional_item_added": (updatedOrder: Order) => {
        fetchOrders();
        playChime("ADDITIONAL_ITEM");
        toast.warning(`⚠️ Additional item added to order #${updatedOrder?.order_number || ""}!`, {
          duration: 6000,
        });
      },
      "order.accepted": () => fetchOrders(),
      "order.preparing": () => fetchOrders(),
      "order.ready": () => fetchOrders(),
      "order.served": () => fetchOrders(),
      "order.completed": () => fetchOrders(),
    },
    { onReconnect: fetchOrders }
  );

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
        toast.success(`Order #${updated.order_number || "Status"} updated to ${newStatus}`);
        fetchOrders();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Unable to update order status. Please try again.");
      }
    } catch (err: any) {
      toast.error(err.message || "Unable to update order status. Please try again.");
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestChime}
              className="px-2.5 py-1.5 rounded-xl border border-[#D8B58A]/30 bg-[#D8B58A]/10 text-[#D8B58A] text-xs font-medium hover:bg-[#D8B58A]/20 transition-colors"
            >
              Test Sound
            </button>
            <button
              onClick={() => {
                getOrInitAudioContext();
                setSoundEnabled(!soundEnabled);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                soundEnabled
                  ? "bg-[#6FAF82]/15 border-[#6FAF82]/30 text-[#6FAF82]"
                  : "bg-[#242424] border-[#2e2e2e] text-[#A8A29E]"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? "Audio: ON" : "Audio: MUTE"}</span>
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

