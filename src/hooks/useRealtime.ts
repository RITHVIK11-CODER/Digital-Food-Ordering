"use client";

import { useEffect } from "react";

export function useRealtime(events: Record<string, (data: any) => void>) {
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        eventSource = new EventSource("/api/realtime/sse");

        eventSource.onopen = () => {
          // Connected
        };

        // Bind custom event listeners
        Object.entries(events).forEach(([eventName, handler]) => {
          eventSource?.addEventListener(eventName, (e: MessageEvent) => {
            try {
              const parsed = JSON.parse(e.data);
              handler(parsed);
            } catch (err) {
              console.error("SSE parse error", err);
            }
          });
        });

        eventSource.onerror = () => {
          eventSource?.close();
          // Auto reconnect after 3 seconds
          retryTimeout = setTimeout(connect, 3000);
        };
      } catch (err) {
        console.error("Failed to initialize SSE:", err);
      }
    };

    connect();

    return () => {
      if (eventSource) eventSource.close();
      clearTimeout(retryTimeout);
    };
  }, [events]);
}
