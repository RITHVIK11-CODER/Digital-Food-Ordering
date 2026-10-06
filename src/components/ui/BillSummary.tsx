"use client";

import React, { useState } from "react";
import { Bill, SplitType } from "@/types/database.types";
import { formatCurrency } from "@/lib/utils";
import { calculateEqualSplit } from "@/lib/pricing";
import { Button } from "./Button";
import { Receipt, Users, CreditCard, QrCode, Banknote, CheckCircle } from "lucide-react";

interface BillSummaryProps {
  bill: Bill;
  onPay?: (billId: string, method: "UPI" | "CARD" | "CASH") => void;
  onRequestSplit?: (billId: string, splitType: SplitType, count: number) => void;
  isStaff?: boolean;
}

export function BillSummary({ bill, onPay, onRequestSplit, isStaff = false }: BillSummaryProps) {
  const [splitCount, setSplitCount] = useState<number>(bill.split_count || 1);
  const [splitType, setSplitType] = useState<SplitType>(bill.split_type || "NONE");

  const equalSplits = splitType === "EQUAL" && splitCount > 1
    ? calculateEqualSplit(bill.final_total, splitCount)
    : [];

  return (
    <div className="bg-[#171717] border border-[#242424] rounded-2xl p-5 shadow-xl text-[#F6EFE7] space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-[#242424]">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#D8B58A]" />
            <h3 className="font-serif text-lg font-normal text-[#F6EFE7]">
              Bill Summary
            </h3>
          </div>
          <p className="text-xs text-[#A8A29E] mt-0.5">
            {bill.bill_number} • {bill.table?.table_number || "Table"}
          </p>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
            bill.status === "PAID"
              ? "bg-[#6FAF82]/15 text-[#6FAF82] border border-[#6FAF82]/30"
              : "bg-[#D6A34A]/15 text-[#D6A34A] border border-[#D6A34A]/30"
          }`}
        >
          {bill.status}
        </span>
      </div>

      {/* Calculations */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-[#A8A29E]">
          <span>Subtotal</span>
          <span className="font-mono text-[#F6EFE7]">{formatCurrency(bill.subtotal)}</span>
        </div>

        <div className="flex items-center justify-between text-[#A8A29E]">
          <span>Taxes (5% GST)</span>
          <span className="font-mono text-[#F6EFE7]">{formatCurrency(bill.tax)}</span>
        </div>

        {bill.discount > 0 && (
          <div className="flex items-center justify-between text-[#6FAF82]">
            <span>Special Cafe Discount</span>
            <span className="font-mono">-{formatCurrency(bill.discount)}</span>
          </div>
        )}

        <div className="pt-3 border-t border-[#242424] flex items-center justify-between text-base font-bold">
          <span className="text-[#F6EFE7]">Final Amount</span>
          <span className="font-mono text-[#D8B58A] text-xl">
            {formatCurrency(bill.final_total)}
          </span>
        </div>
      </div>

      {/* Split Bill Section */}
      {bill.status !== "PAID" && (
        <div className="pt-3 border-t border-[#242424] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#F6EFE7] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#C99A8A]" />
              Split Bill Options
            </span>

            <div className="flex items-center gap-1 bg-[#242424] rounded-lg p-0.5">
              <button
                onClick={() => {
                  setSplitType("NONE");
                  setSplitCount(1);
                  onRequestSplit?.(bill.id, "NONE", 1);
                }}
                className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors ${
                  splitType === "NONE" ? "bg-[#C99A8A] text-[#080808]" : "text-[#A8A29E]"
                }`}
              >
                Full
              </button>
              <button
                onClick={() => {
                  setSplitType("EQUAL");
                  const count = splitCount > 1 ? splitCount : 2;
                  setSplitCount(count);
                  onRequestSplit?.(bill.id, "EQUAL", count);
                }}
                className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors ${
                  splitType === "EQUAL" ? "bg-[#C99A8A] text-[#080808]" : "text-[#A8A29E]"
                }`}
              >
                Equal
              </button>
            </div>
          </div>

          {splitType === "EQUAL" && (
            <div className="bg-[#242424]/60 p-3 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#A8A29E]">Number of People:</span>
                <div className="flex items-center gap-2">
                  {[2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        setSplitCount(num);
                        onRequestSplit?.(bill.id, "EQUAL", num);
                      }}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                        splitCount === num
                          ? "bg-[#D8B58A] text-[#080808] shadow"
                          : "bg-[#171717] text-[#A8A29E] hover:text-[#F6EFE7]"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2e2e2e]">
                {equalSplits.map((amount, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#171717] border border-[#2e2e2e] flex flex-col"
                  >
                    <span className="text-[10px] text-[#A8A29E]">Person {idx + 1}</span>
                    <span className="font-mono font-bold text-sm text-[#D8B58A]">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Actions */}
      {bill.status !== "PAID" && (
        <div className="pt-3 border-t border-[#242424] space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-[#A8A29E] block mb-2 font-medium">
            Select Payment Method
          </span>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPay?.(bill.id, "UPI")}
              className="flex-col h-14 gap-1 border-[#D8B58A]/30 hover:border-[#D8B58A]"
            >
              <QrCode className="w-4 h-4 text-[#D8B58A]" />
              <span className="text-[11px]">UPI / QR</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPay?.(bill.id, "CARD")}
              className="flex-col h-14 gap-1 border-[#C99A8A]/30 hover:border-[#C99A8A]"
            >
              <CreditCard className="w-4 h-4 text-[#C99A8A]" />
              <span className="text-[11px]">Card</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPay?.(bill.id, "CASH")}
              className="flex-col h-14 gap-1 border-[#6FAF82]/30 hover:border-[#6FAF82]"
            >
              <Banknote className="w-4 h-4 text-[#6FAF82]" />
              <span className="text-[11px]">Cash</span>
            </Button>
          </div>
        </div>
      )}

      {bill.status === "PAID" && (
        <div className="pt-2 flex items-center justify-center gap-2 text-[#6FAF82] bg-[#6FAF82]/10 p-3 rounded-xl text-xs font-semibold">
          <CheckCircle className="w-4 h-4" />
          <span>Payment settled in full. Thank you!</span>
        </div>
      )}
    </div>
  );
}

