"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { CafeLogo } from "@/components/brand/CafeLogo";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Lock, ChefHat, UtensilsCrossed, ReceiptText, UserCog, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { UserRole } from "@/types/database.types";
import { toast } from "sonner";

interface Workstation {
  role: UserRole;
  title: string;
  subtitle: string;
  icon: any;
  badge: string;
  defaultPinHint: string;
}

const WORKSTATIONS: Workstation[] = [
  {
    role: "CHEF",
    title: "Kitchen Station",
    subtitle: "KDS & Live Barista Ticket Stream",
    icon: ChefHat,
    badge: "CHEF",
    defaultPinHint: "PIN: 2222",
  },
  {
    role: "WAITER",
    title: "Floor & Tables",
    subtitle: "Table Floor Map & Service Calls",
    icon: UtensilsCrossed,
    badge: "WAITER",
    defaultPinHint: "PIN: 3333",
  },
  {
    role: "CASHIER",
    title: "Billing & POS Desk",
    subtitle: "Order Search & Payment Settlement",
    icon: ReceiptText,
    badge: "CASHIER",
    defaultPinHint: "PIN: 4444",
  },
  {
    role: "OWNER",
    title: "Executive Admin",
    subtitle: "15-Day Analytics & Operations",
    icon: UserCog,
    badge: "ADMIN",
    defaultPinHint: "PIN: 1111",
  },
];

function StaffPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedStation, setSelectedStation] = useState<Workstation>(WORKSTATIONS[0]);

  const [pin, setPin] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const errorParam = searchParams.get("error");
  const requiredRole = searchParams.get("required");
  const redirectParam = searchParams.get("redirect");

  useEffect(() => {
    if (errorParam === "unauthorized") {
      setErrorMessage(`Access restricted. Requires ${requiredRole || "authorized"} workstation credentials.`);
    }
  }, [errorParam, requiredRole]);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setErrorMessage(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleClear = () => {
    setPin("");
    setErrorMessage(null);
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin || pin.length < 4) {
      setErrorMessage("Please enter a valid 4-digit PIN.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedStation.role,
          pin: pin.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      toast.success(`Welcome, ${data.user.name}!`);
      
      const targetUrl = redirectParam || data.redirectUrl || "/admin";
      router.push(targetUrl);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid PIN code.");
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center p-4 sm:p-6 text-[#F6EFE7]">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <CafeLogo size="md" showTagline={true} href="/" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#171717] border border-[#242424] text-xs text-[#D8B58A] font-semibold mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D8B58A]" />
            <span>STAFF WORKSTATION PORTAL</span>
          </div>
        </div>

        {/* Error Alert if redirected */}
        {errorMessage && (
          <div className="bg-[#C96B6B]/15 border border-[#C96B6B]/30 text-[#C96B6B] px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Workstation Selection Grid */}
        <div className="bg-[#171717] border border-[#242424] rounded-3xl p-6 shadow-2xl space-y-6">
          <div>
            <h3 className="text-xs uppercase tracking-widest text-[#A8A29E] font-semibold mb-3">
              1. Select Workstation
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {WORKSTATIONS.map((station) => {
                const isSelected = selectedStation.role === station.role;
                const IconComponent = station.icon;
                return (
                  <button
                    key={station.role}
                    type="button"
                    onClick={() => {
                      setSelectedStation(station);
                      setErrorMessage(null);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#242424] border-[#D8B58A] shadow-lg shadow-black/40"
                        : "bg-[#0f0f0f] border-[#242424] hover:border-[#383838] opacity-80 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-xl ${isSelected ? "bg-[#D8B58A]/20 text-[#D8B58A]" : "bg-[#171717] text-[#A8A29E]"}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isSelected ? "bg-[#D8B58A] text-[#080808]" : "bg-[#242424] text-[#A8A29E]"}`}>
                        {station.badge}
                      </span>
                    </div>
                    <div>
                      <div className={`text-xs font-semibold ${isSelected ? "text-[#F6EFE7]" : "text-[#A8A29E]"}`}>
                        {station.title}
                      </div>
                      <div className="text-[10px] text-[#A8A29E] truncate mt-0.5">
                        {station.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN Input & Keypad */}
          <div className="pt-4 border-t border-[#242424] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-widest text-[#A8A29E] font-semibold">
                2. Enter 4-Digit PIN
              </h3>
              <span className="text-[11px] text-[#D8B58A]/80 font-mono">
                {selectedStation.defaultPinHint}
              </span>
            </div>

            {/* PIN Dots Display */}
            <div className="flex items-center justify-center gap-3 py-3 bg-[#080808] rounded-2xl border border-[#242424]">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    pin.length > index
                      ? "bg-[#D8B58A] shadow-[0_0_10px_rgba(216,181,138,0.5)] scale-110"
                      : "bg-[#242424] border border-[#383838]"
                  }`}
                />
              ))}
            </div>

            {/* Numeric Keypad for POS touch & ease of use */}
            <div className="grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  disabled={isLoading}
                  className="py-3 rounded-xl bg-[#242424]/60 hover:bg-[#2e2e2e] active:scale-95 text-base font-semibold text-[#F6EFE7] border border-[#2e2e2e] transition-all"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading || pin.length === 0}
                className="py-3 rounded-xl bg-[#242424]/30 hover:bg-[#242424] text-xs font-semibold text-[#A8A29E] border border-[#242424] transition-all"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress("0")}
                disabled={isLoading}
                className="py-3 rounded-xl bg-[#242424]/60 hover:bg-[#2e2e2e] active:scale-95 text-base font-semibold text-[#F6EFE7] border border-[#2e2e2e] transition-all"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                disabled={isLoading || pin.length === 0}
                className="py-3 rounded-xl bg-[#242424]/30 hover:bg-[#242424] text-xs font-semibold text-[#A8A29E] border border-[#242424] transition-all"
              >
                ⌫
              </button>
            </div>

            {/* Submit Button */}
            <Button
              variant="primary"
              size="lg"
              disabled={isLoading || pin.length < 4}
              onClick={() => handleLogin()}
              className="w-full text-xs uppercase tracking-widest font-bold h-12 gap-2 shadow-lg shadow-[#D8B58A]/10"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Access {selectedStation.title}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-[#A8A29E] space-y-1">
          <p>Velvet Bloom Café • Secure Workstation Station Access</p>
          <p className="text-[11px] text-[#78716c]">Powered by Kage Origin</p>
        </div>
      </div>
    </div>
  );
}

export default function StaffPortalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080808] flex items-center justify-center text-[#D8B58A] text-xs">Loading Workstation Portal...</div>}>
      <StaffPortalContent />
    </Suspense>
  );
}

