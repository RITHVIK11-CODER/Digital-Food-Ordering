"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { BillSummary } from "@/components/ui/BillSummary";
import { Bill, SplitType } from "@/types/database.types";
import { LoadingState, EmptyState } from "@/components/ui/EmptyState";
import { ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

function BillContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tableId = searchParams.get("tableId") || (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("vb_table_info") || "{}").tableId : null);
  const sessionId = searchParams.get("sessionId") || (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("vb_table_info") || "{}").sessionId : null);

  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);

  const requestOrFetchBill = async (tId: string, sId: string) => {
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: tId, sessionId: sId, splitType: "NONE", splitCount: 1 }),
      });

      if (res.ok) {
        const data = await res.json();
        setBill(data);
      } else {
        throw new Error("Could not find or generate bill.");
      }
    } catch (err: any) {
      console.error("Bill fetch error", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tableId && sessionId) {
      requestOrFetchBill(tableId, sessionId);
    } else {
      setIsLoading(false);
    }
  }, [tableId, sessionId]);

  const handlePay = async (billId: string, method: "UPI" | "CARD" | "CASH") => {
    try {
      const res = await fetch(`/api/bills/${billId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: method }),
      });

      if (res.ok) {
        const updated = await res.json();
        setBill(updated);
        setIsPaidSuccess(true);
        toast.success("Payment confirmed successfully!");
      }
    } catch (err) {
      toast.error("Payment settlement failed.");
    }
  };

  const handleRequestSplit = async (billId: string, splitType: SplitType, count: number) => {
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId, sessionId, splitType, splitCount: count }),
      });

      if (res.ok) {
        const updated = await res.json();
        setBill(updated);
      }
    } catch (err) {
      console.error("Failed to update split", err);
    }
  };

  if (isLoading) {
    return <LoadingState message="Calculating bill & tax summary..." />;
  }

  if (!bill) {
    return (
      <EmptyState
        title="No Bill Available"
        description="There are no active unpaid orders for this table."
        actionLabel="Back to Menu"
        onAction={() => router.push("/")}
      />
    );
  }

  if (isPaidSuccess || bill.status === "PAID") {
    return (
      <div className="bg-[#171717] border border-[#242424] rounded-2xl p-6 text-center space-y-5 shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-[#6FAF82]/20 text-[#6FAF82] flex items-center justify-center mx-auto border border-[#6FAF82]/30">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h2 className="font-serif text-2xl font-normal text-[#F6EFE7]">
            Thank You for Visiting!
          </h2>
          <p className="text-xs text-[#A8A29E] mt-1.5">
            Your bill #{bill.bill_number} has been settled in full.
          </p>
        </div>

        <div className="p-4 bg-[#080808] rounded-xl border border-[#242424] space-y-1">
          <span className="text-[11px] text-[#A8A29E] uppercase tracking-wider">Amount Paid</span>
          <p className="font-serif text-2xl font-bold text-[#D8B58A]">
            ₹{bill.final_total.toFixed(2)}
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <Link href={`/feedback?orderId=${bill.order_id || ""}&sessionId=${bill.session_id}`}>
            <Button variant="primary" className="w-full text-xs h-11">
              Rate Your Culinary Experience
            </Button>
          </Link>

          <Link href="/">
            <Button variant="outline" className="w-full text-xs h-11">
              Return to Menu
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-[#A8A29E] hover:text-[#F6EFE7]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Menu</span>
        </Link>
      </div>

      <BillSummary
        bill={bill}
        onPay={handlePay}
        onRequestSplit={handleRequestSplit}
      />
    </div>
  );
}

export default function BillPage() {
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col text-[#F6EFE7]">
      <CustomerHeader />
      <main className="flex-1 max-w-xl mx-auto w-full p-4 sm:p-6">
        <Suspense fallback={<LoadingState message="Loading bill..." />}>
          <BillContent />
        </Suspense>
      </main>
    </div>
  );
}
