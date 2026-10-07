"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CafeLogo } from "../brand/CafeLogo";
import { ShieldCheck, LogOut, RefreshCw, Wifi, WifiOff, Activity } from "lucide-react";
import { UserRole } from "@/types/database.types";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { toast } from "sonner";

interface StaffHeaderProps {
  role: UserRole;
  staffName?: string;
  onRefresh?: () => void;
  activeOrdersCount?: number;
  isRealtimeConnected?: boolean;
}

export function StaffHeader({
  role,
  staffName,
  onRefresh,
  activeOrdersCount = 0,
  isRealtimeConnected = true,
}: StaffHeaderProps) {
  const router = useRouter();
  const network = useNetworkStatus(isRealtimeConnected);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const roleConfigs: Record<UserRole, { label: string; badgeColor: string }> = {
    OWNER: { label: "Executive Admin", badgeColor: "bg-[#D8B58A]/15 text-[#D8B58A] border-[#D8B58A]/30" },
    MANAGER: { label: "Operations Manager", badgeColor: "bg-[#C99A8A]/15 text-[#C99A8A] border-[#C99A8A]/30" },
    CHEF: { label: "Kitchen Station", badgeColor: "bg-[#6FAF82]/15 text-[#6FAF82] border-[#6FAF82]/30" },
    WAITER: { label: "Floor & Tables", badgeColor: "bg-[#D8B58A]/15 text-[#D8B58A] border-[#D8B58A]/30" },
    CASHIER: { label: "Billing Desk", badgeColor: "bg-[#6FAF82]/15 text-[#6FAF82] border-[#6FAF82]/30" },
    CUSTOMER: { label: "Customer", badgeColor: "bg-[#242424] text-[#A8A29E] border-[#2e2e2e]" },
  };

  const currentRoleConfig = roleConfigs[role] || roleConfigs.OWNER;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/staff-logout", { method: "POST" });
      toast.info("Logged out from workstation.");
      router.push("/staff");
      router.refresh();
    } catch {
      router.push("/staff");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="w-full bg-[#080808] border-b border-[#242424] px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Logo and Station Title */}
        <div className="flex items-center gap-4">
          <CafeLogo size="sm" showTagline={false} href="/" />

          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-[#242424]">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentRoleConfig.badgeColor}`}
            >
              {currentRoleConfig.label}
            </span>
          </div>
        </div>

        {/* Action Controls & Diagnostic Status */}
        <div className="flex items-center gap-3">
          {/* Network & Realtime Status Indicator */}
          <div className="flex items-center gap-2 bg-[#171717] border border-[#242424] px-3 py-1.5 rounded-xl text-xs">
            {network.quality === "ONLINE" ? (
              <div className="flex items-center gap-1.5 text-[#6FAF82]">
                <span className="w-2 h-2 rounded-full bg-[#6FAF82] animate-pulse" />
                <span className="font-medium hidden md:inline">Live</span>
                {network.latencyMs !== null && (
                  <span className="text-[11px] text-[#A8A29E]">· {network.latencyMs}ms</span>
                )}
              </div>
            ) : network.quality === "SLOW" ? (
              <div className="flex items-center gap-1.5 text-[#D6A34A]">
                <span className="w-2 h-2 rounded-full bg-[#D6A34A]" />
                <span className="font-medium">Slow Connection</span>
                {network.latencyMs !== null && (
                  <span className="text-[11px] text-[#A8A29E]">· {network.latencyMs}ms</span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[#C96B6B]">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="font-medium">Offline</span>
              </div>
            )}
          </div>

          {/* Quick manual refresh */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-[#171717] border border-[#2e2e2e] text-[#A8A29E] hover:text-[#F6EFE7] hover:border-[#3e3e3e] transition-colors"
              title="Refresh Live Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Staff Profile Badge */}
          <div className="flex items-center gap-2 bg-[#171717] border border-[#2e2e2e] px-3 py-1.5 rounded-xl text-xs text-[#F6EFE7]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D8B58A]" />
            <span className="hidden sm:inline font-medium">{staffName || currentRoleConfig.label}</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171717] border border-[#2e2e2e] text-[#C96B6B] hover:bg-[#C96B6B]/15 hover:border-[#C96B6B]/40 text-xs font-semibold transition-all"
            title="Log out from workstation"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
