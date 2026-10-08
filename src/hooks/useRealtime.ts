"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export type RealtimeConnectionStatus = "CONNECTED" | "RECONNECTING" | "DISCONNECTED";

export interface UseRealtimeOptions {
  tableId?: string;
  sessionId?: string;
  orderId?: string;
  onReconnect?: () => void;
}

/**
 * Production Real-time Event Subscription Hook.
 * Connects directly to Supabase Realtime WebSockets with resilient dual-stream fallback.
 * Uses persistent references to prevent subscription thrashing and dropped events.
 */
export function useRealtime(
  events: Record<string, (data: any) => void>,
  options?: UseRealtimeOptions
) {
  const [status, setStatus] = useState<RealtimeConnectionStatus>("CONNECTED");
  const eventsRef = useRef(events);
  const optionsRef = useRef(options);

  // Keep references fresh without re-triggering subscription lifecycle
  useEffect(() => {
    eventsRef.current = events;
    optionsRef.current = options;
  });

  const dispatchEvent = useCallback((eventName: string, data: any) => {
    try {
      const handler = eventsRef.current[eventName];
      if (handler) {
        // Apply optional client-side filters if specified
        const opt = optionsRef.current;
        const incomingId = data?.id || data?.order_id || data?.order?.id;
        const incomingTableId = data?.table_id || data?.tableId;
        const incomingSessionId = data?.session_id || data?.sessionId;

        if (opt?.orderId && incomingId && incomingId !== opt.orderId) return;
        if (opt?.tableId && incomingTableId && incomingTableId !== opt.tableId) return;
        if (opt?.sessionId && incomingSessionId && incomingSessionId !== opt.sessionId) return;

        handler(data);
      }
    } catch (err) {
      console.warn(`[Realtime] Handler error for ${eventName}:`, err);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    let sseSource: EventSource | null = null;
    let sseRetryTimer: NodeJS.Timeout | null = null;

    const supabase = createClient();
    const channelTopic = "cafe_realtime_stream";

    // 1. Primary: Supabase Realtime WebSocket Channel
    const channel = supabase.channel(channelTopic, {
      config: {
        broadcast: { ack: false },
      },
    });

    // Listen to PostgreSQL changes on orders
    channel.on(
      "postgres_changes" as any,
      { event: "INSERT", schema: "public", table: "orders" },
      (payload: any) => {
        if (!isSubscribed) return;
        const newOrder = payload.new;
        dispatchEvent("order.created", newOrder);
      }
    );

    channel.on(
      "postgres_changes" as any,
      { event: "UPDATE", schema: "public", table: "orders" },
      (payload: any) => {
        if (!isSubscribed) return;
        const updatedOrder = payload.new;
        const status = updatedOrder?.status?.toLowerCase();
        if (status) {
          dispatchEvent(`order.${status}`, updatedOrder);
        }
        dispatchEvent("order.updated", updatedOrder);
      }
    );

    // Listen to PostgreSQL changes on order_items
    channel.on(
      "postgres_changes" as any,
      { event: "INSERT", schema: "public", table: "order_items" },
      (payload: any) => {
        if (!isSubscribed) return;
        const item = payload.new;
        if (item?.is_additional) {
          dispatchEvent("order.additional_item_added", item);
        }
      }
    );

    // Listen to PostgreSQL changes on bills
    channel.on(
      "postgres_changes" as any,
      { event: "INSERT", schema: "public", table: "bills" },
      (payload: any) => {
        if (!isSubscribed) return;
        dispatchEvent("bill.requested", payload.new);
      }
    );

    channel.on(
      "postgres_changes" as any,
      { event: "UPDATE", schema: "public", table: "bills" },
      (payload: any) => {
        if (!isSubscribed) return;
        const bill = payload.new;
        if (bill?.status === "PAID") {
          dispatchEvent("payment.completed", bill);
        }
        dispatchEvent("bill.updated", bill);
      }
    );

    // Listen to PostgreSQL changes on tables
    channel.on(
      "postgres_changes" as any,
      { event: "UPDATE", schema: "public", table: "tables" },
      (payload: any) => {
        if (!isSubscribed) return;
        dispatchEvent("table.status_changed", payload.new);
      }
    );

    // Listen to PostgreSQL changes on service_requests
    channel.on(
      "postgres_changes" as any,
      { event: "INSERT", schema: "public", table: "service_requests" },
      (payload: any) => {
        if (!isSubscribed) return;
        dispatchEvent("service_request.created", payload.new);
      }
    );

    channel.on(
      "postgres_changes" as any,
      { event: "UPDATE", schema: "public", table: "service_requests" },
      (payload: any) => {
        if (!isSubscribed) return;
        dispatchEvent("service_request.updated", payload.new);
      }
    );

    // Listen to PostgreSQL changes on notifications
    channel.on(
      "postgres_changes" as any,
      { event: "INSERT", schema: "public", table: "notifications" },
      (payload: any) => {
        if (!isSubscribed) return;
        dispatchEvent("notification.created", payload.new);
      }
    );

    // Listen to direct broadcast events
    channel.on("broadcast", { event: "*" }, (payload: any) => {
      if (!isSubscribed) return;
      if (payload?.event && payload?.payload) {
        dispatchEvent(payload.event, payload.payload);
      }
    });

    // Subscribe to channel
    channel.subscribe((statusResult: string) => {
      if (!isSubscribed) return;
      if (statusResult === "SUBSCRIBED") {
        setStatus("CONNECTED");
        optionsRef.current?.onReconnect?.();
      } else if (statusResult === "CLOSED" || statusResult === "TIMED_OUT") {
        setStatus("RECONNECTING");
      }
    });

    const handleOnline = () => {
      if (isSubscribed) {
        setStatus("CONNECTED");
        optionsRef.current?.onReconnect?.();
      }
    };

    const handleOffline = () => {
      if (isSubscribed) {
        setStatus("RECONNECTING");
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    // 2. Secondary Stream: Resilient Fallback SSE connection
    const connectSSE = () => {
      try {
        if (typeof window === "undefined") return;
        sseSource = new EventSource("/api/realtime/sse");

        sseSource.onopen = () => {
          if (isSubscribed) setStatus("CONNECTED");
        };

        const eventNames = [
          "order.created",
          "order.accepted",
          "order.preparing",
          "order.ready",
          "order.served",
          "order.completed",
          "order.additional_item_added",
          "bill.requested",
          "payment.completed",
          "table.status_changed",
          "service_request.created",
          "service_request.updated",
          "notification.created",
        ];

        eventNames.forEach((evName) => {
          sseSource?.addEventListener(evName, (e: MessageEvent) => {
            if (!isSubscribed) return;
            try {
              const parsed = JSON.parse(e.data);
              dispatchEvent(evName, parsed);
            } catch (err) {
              console.warn("[SSE] Parse error", err);
            }
          });
        });

        sseSource.onerror = () => {
          if (!isSubscribed) return;
          sseSource?.close();
          setStatus("RECONNECTING");
          sseRetryTimer = setTimeout(connectSSE, 5000);
        };
      } catch (err) {
        console.warn("[SSE] Connection error:", err);
      }
    };

    connectSSE();

    return () => {
      isSubscribed = false;
      supabase.removeChannel(channel);
      if (sseSource) sseSource.close();
      if (sseRetryTimer) clearTimeout(sseRetryTimer);
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, [dispatchEvent]);

  return {
    status,
    isConnected: status === "CONNECTED",
    isReconnecting: status === "RECONNECTING",
  };
}
