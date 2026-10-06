"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CafeLogo } from "../brand/CafeLogo";
import { Bell, ShieldCheck, Power, RefreshCw } from "lucide-react";
import { UserRole } from "@/types/database.types";
import { Button } from "../ui/Button";

interface StaffHeaderProps {
  role: UserRole;
  staffName?: string;
  onRefresh?: () => void;
  activeOrdersCount?: number;
}

export function StaffHeader({ role, staffName, onRefresh, activeOrdersCount = 0 }: StaffHeaderProps) {
  const roleBadges: Record<UserRole, { label: string; color: string }> = {
    OWNER: { label: "Executive Owner", color: "bg-[#D8B58A]/15 text-[#D8B58A] border-[#D8B58A]/30" },
    MANAGER: { label: "Operations Manager", color: "bg-[#C99A8A]/15 text-[#C99A8A] border-[#C99A8A]/30" },
    CHEF: { label: "Kitchen Station", color: "bg-[#6FAF82]/15 text-[#6FAF82] border-[#6FAF82]/30" },
    WAITER: { label: "Floor & Tables", color: "bg-[#D8B58A]/15 text-[#D8B58A] border-[#D8B58A]/30" },
    CASHIER: { label: "Billing & Register", color: "bg-[#6FAF82]/15 text-[#6FAF82] border-[#6FAF82]/30" },
    CUSTOMER: { label: "Customer", color: "bg-[#242424] text-[#A8A29E] border-[#2e2e2e]" },
  };

  return (
    <header className="w-full bg-[#080808] border-b border-[#242424] px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Logo and Station Title */}
        <div className="flex items-center gap-4">
          <CafeLogo size="sm" showTagline={false} href="/" />

          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-[#242424]">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleBadges[role].color}`}
            >
              {roleBadges[role].label}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Quick Switch Stations */}
          <div className="hidden md:flex items-center gap-1 bg-[#171717] border border-[#242424] p-1 rounded-xl text-xs">
            <Link
              href="/chef"
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                role === "CHEF" ? "bg-[#242424] text-[#D8B58A] font-semibold" : "text-[#A8A29E] hover:text-[#F6EFE7]"
              }`}
            >
              Chef
            </Link>
            <Link
              href="/waiter"
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                role === "WAITER" ? "bg-[#242424] text-[#D8B58A] font-semibold" : "text-[#A8A29E] hover:text-[#F6EFE7]"
              }`}
            >
              Waiter
            </Link>
            <Link
              href="/cashier"
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                role === "CASHIER" ? "bg-[#242424] text-[#D8B58A] font-semibold" : "text-[#A8A29E] hover:text-[#F6EFE7]"
              }`}
            >
              Cashier
            </Link>
            <Link
              href="/owner"
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                role === "OWNER" ? "bg-[#242424] text-[#D8B58A] font-semibold" : "text-[#A8A29E] hover:text-[#F6EFE7]"
              }`}
            >
              Owner
            </Link>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-[#171717] border border-[#2e2e2e] text-[#A8A29E] hover:text-[#F6EFE7] hover:border-[#3e3e3e] transition-colors"
              title="Refresh Live Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* User Name */}
          <div className="flex items-center gap-2 bg-[#171717] border border-[#2e2e2e] px-3 py-1.5 rounded-xl text-xs text-[#F6EFE7]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D8B58A]" />
            <span className="hidden sm:inline font-medium">{staffName || "Staff Member"}</span>
          </div>

          <Link
            href="/"
            className="p-2 rounded-xl bg-[#171717] border border-[#2e2e2e] text-[#C96B6B] hover:bg-[#C96B6B]/10 transition-colors"
            title="Customer View"
          >
            <Power className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
