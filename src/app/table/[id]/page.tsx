"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/lib/store/cart-context";
import { CafeLogo } from "@/components/brand/CafeLogo";
import { LoadingState } from "@/components/ui/EmptyState";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function TableQRRoute() {
  const params = useParams();
  const router = useRouter();
  const { setTableInfo } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any>(null);

  const tableIdOrToken = params?.id as string;

  useEffect(() => {
    if (!tableIdOrToken) return;

    const verifyTable = async () => {
      try {
        const res = await fetch(`/api/tables/${tableIdOrToken}`);
        if (!res.ok) {
          throw new Error("Invalid or expired table QR code.");
        }
        const data = await res.json();
        setTableData(data);
        setTableInfo(data.table.id, data.table.table_number, data.session.id);

        // Redirect to menu after brief welcome
        setTimeout(() => {
          router.push("/");
        }, 1200);
      } catch (err: any) {
        setError(err.message || "Failed to scan table QR code.");
      }
    };

    verifyTable();
  }, [tableIdOrToken, router, setTableInfo]);

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center p-6 text-center text-[#F6EFE7]">
      <CafeLogo size="lg" showTagline={true} />

      <div className="mt-8 max-w-sm w-full bg-[#171717] border border-[#242424] rounded-2xl p-6 shadow-2xl">
        {error ? (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#C96B6B]/15 text-[#C96B6B] flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-normal text-[#F6EFE7]">
              Table Verification Failed
            </h3>
            <p className="text-xs text-[#A8A29E] leading-relaxed">
              {error}
            </p>
            <Button
              variant="primary"
              className="w-full text-xs"
              onClick={() => router.push("/")}
            >
              Browse General Menu
            </Button>
          </div>
        ) : tableData ? (
          <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="w-12 h-12 rounded-full bg-[#6FAF82]/15 text-[#6FAF82] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-normal text-[#D8B58A]">
              Welcome to {tableData.table.table_number}
            </h3>
            <p className="text-xs text-[#A8A29E]">
              Table session established. Loading our handcrafted menu...
            </p>
          </div>
        ) : (
          <LoadingState message="Connecting to table session..." />
        )}
      </div>
    </div>
  );
}

