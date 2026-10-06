"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CafeLogo } from "../brand/CafeLogo";
import { LanguageSelector } from "../ui/LanguageSelector";
import { useCart } from "@/lib/store/cart-context";
import { ShoppingBag, Bell, BellRing, UtensilsCrossed, PhoneCall } from "lucide-react";
import { Button } from "../ui/Button";

interface CustomerHeaderProps {
  onCallWaiter?: () => void;
}

export function CustomerHeader({ onCallWaiter }: CustomerHeaderProps) {
  const { totalCount, tableNumber } = useCart();
  const [hasRequestedAssistance, setHasRequestedAssistance] = useState(false);

  const handleCallStaff = () => {
    setHasRequestedAssistance(true);
    onCallWaiter?.();
    setTimeout(() => setHasRequestedAssistance(false), 5000);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080808]/90 backdrop-blur-md border-b border-[#242424] px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <CafeLogo size="sm" showTagline={false} href="/" />

        {/* Right Actions: Table Info, Language, Call Waiter, Cart */}
        <div className="flex items-center gap-2 sm:gap-3">
          {tableNumber && (
            <div className="hidden xs:flex items-center gap-1.5 bg-[#171717] border border-[#2e2e2e] px-2.5 py-1 rounded-full text-xs font-semibold text-[#D8B58A]">
              <span className="w-2 h-2 rounded-full bg-[#6FAF82]" />
              <span>{tableNumber}</span>
            </div>
          )}

          <LanguageSelector />

          {/* Quick Call Waiter Button */}
          <button
            onClick={handleCallStaff}
            title="Call Waiter"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all ${
              hasRequestedAssistance
                ? "bg-[#6FAF82]/20 border-[#6FAF82] text-[#6FAF82]"
                : "bg-[#171717] border-[#2e2e2e] text-[#A8A29E] hover:text-[#F6EFE7]"
            }`}
          >
            <Bell className={`w-3.5 h-3.5 ${hasRequestedAssistance ? "text-[#6FAF82] animate-bounce" : "text-[#C99A8A]"}`} />
            <span className="hidden sm:inline">
              {hasRequestedAssistance ? "Waiter Alerted" : "Call Waiter"}
            </span>
          </button>

          {/* Cart Icon */}
          <Link
            href="/cart"
            className="relative p-2 rounded-full bg-[#171717] border border-[#2e2e2e] text-[#F6EFE7] hover:border-[#C99A8A]/50 transition-colors"
          >
            <ShoppingBag className="w-4 h-4 text-[#D8B58A]" />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-[#C99A8A] to-[#D8B58A] text-[#080808] text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                {totalCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
