"use client";

import { useState, useEffect, useCallback } from "react";

export type ConnectionQuality = "ONLINE" | "SLOW" | "OFFLINE";
export type RealtimeStatusType = "CONNECTED" | "RECONNECTING" | "DISCONNECTED";

export interface NetworkStatus {
  quality: ConnectionQuality;
  latencyMs: number | null;
  isOnline: boolean;
  realtimeStatus: RealtimeStatusType;
  isRealtimeConnected: boolean;
  lastChecked: Date | null;
  checkNow: () => Promise<void>;
}

export function useNetworkStatus(realtimeStatusInput: RealtimeStatusType | boolean = "CONNECTED"): NetworkStatus {
  const realtimeStatus: RealtimeStatusType =
    typeof realtimeStatusInput === "string"
      ? realtimeStatusInput
      : realtimeStatusInput
      ? "CONNECTED"
      : "DISCONNECTED";

  const [isOnline, setIsOnline] = useState<boolean>(true);

  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [quality, setQuality] = useState<ConnectionQuality>("ONLINE");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkPing = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!navigator.onLine) {
      setIsOnline(false);
      setQuality("OFFLINE");
      setLatencyMs(null);
      return;
    }

    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch("/api/health", {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);
      setIsOnline(true);

      if (!res.ok) {
        setQuality("SLOW");
      } else if (elapsed > 1800) {
        setQuality("SLOW");
      } else {
        setQuality("ONLINE");
      }
      setLastChecked(new Date());
    } catch {
      if (!navigator.onLine) {
        setIsOnline(false);
        setQuality("OFFLINE");
      } else {
        setQuality("SLOW");
      }
      setLatencyMs(null);
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    checkPing();

    const handleOnline = () => {
      setIsOnline(true);
      checkPing();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setQuality("OFFLINE");
      setLatencyMs(null);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodic ping every 15 seconds
    const interval = setInterval(checkPing, 15000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [checkPing]);

  return {
    quality,
    latencyMs,
    isOnline,
    realtimeStatus,
    isRealtimeConnected: realtimeStatus === "CONNECTED",
    lastChecked,
    checkNow: checkPing,
  };
}


