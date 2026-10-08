"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { useCart } from "@/lib/store/cart-context";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/components/ui/LanguageSelector";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Trash2, Plus, Minus, ChefHat, Sparkles, User, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CartPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    items,
    tableId,
    sessionId,
    tableNumber,
    customerName,
    setCustomerName,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    tax,
    total,
  } = useCart();

  const [phone, setPhone] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    let effectiveTableId = tableId;
    let effectiveSessionId = sessionId;
    let effectiveCustomerName = customerName?.trim() || "";

    if (!effectiveTableId || !effectiveSessionId) {
      try {
        const stored = localStorage.getItem("vb_table_info");
        if (stored) {
          const parsed = JSON.parse(stored);
          effectiveTableId = effectiveTableId || parsed.tableId || parsed.id;
          effectiveSessionId = effectiveSessionId || parsed.sessionId;
        }
      } catch {}
    }

    if (!effectiveCustomerName) {
      try {
        const savedName = localStorage.getItem("vb_customer_name");
        if (savedName) effectiveCustomerName = savedName.trim();
      } catch {}
    }

    if (!effectiveCustomerName) {
      effectiveCustomerName = "Valued Guest";
    }

    if (!effectiveTableId) {
      effectiveTableId = "a0000000-0000-0000-0000-000000000001";
      effectiveSessionId = effectiveSessionId || `sess_tbl_01_${Date.now()}`;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        tableId: effectiveTableId,
        sessionId: effectiveSessionId,
        customerName: effectiveCustomerName,
        customerPhone: phone.trim() || undefined,
        specialInstructions: specialInstructions.trim() || undefined,
        items: items.map((cartItem) => ({
          menuItemId: cartItem.menuItem.id,
          quantity: cartItem.quantity,
          specialNotes: cartItem.specialNotes,
          selectedOptions: cartItem.selectedOptions.map((opt) => ({
            groupName: opt.groupName,
            optionName: opt.optionName,
            extraPrice: opt.extraPrice,
          })),
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to place order.");
      }

      const createdOrder = await res.json();
      localStorage.setItem("vb_last_order_id", createdOrder.id);
      clearCart();

      toast.success(`Order ${createdOrder.order_number} confirmed!`);
      router.push(`/track?orderId=${createdOrder.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to process order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col text-[#F6EFE7]">
        <CustomerHeader />
        <main className="flex-1 max-w-lg mx-auto w-full p-6 flex items-center justify-center">
          <EmptyState
            title={t("empty_cart")}
            description={t("add_items")}
            actionLabel="Explore Menu"
            onAction={() => router.push("/")}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col text-[#F6EFE7]">
      <CustomerHeader />

      <main className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Back Link and Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-[#A8A29E] hover:text-[#F6EFE7] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Ordering</span>
          </Link>

          <div className="bg-[#171717] border border-[#242424] px-3 py-1 rounded-full text-xs font-semibold text-[#D8B58A]">
            {tableNumber || "Table 1"}
          </div>
        </div>

        <div className="pb-2 border-b border-[#242424]">
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#F6EFE7]">
            Review Order
          </h1>
          <p className="text-xs text-[#A8A29E] mt-1">
            Artisan culinary items curated for your table
          </p>
        </div>

        {/* Selected Items List */}
        <div className="space-y-3">
          {items.map((cartItem) => (
            <div
              key={cartItem.id}
              className="bg-[#171717] border border-[#242424] rounded-2xl p-4 flex flex-col gap-3 shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <h4 className="font-serif text-base font-normal text-[#F6EFE7]">
                    {cartItem.menuItem.name}
                  </h4>

                  {/* Options */}
                  {cartItem.selectedOptions.length > 0 && (
                    <div className="mt-1 text-[11px] text-[#A8A29E] space-y-0.5">
                      {cartItem.selectedOptions.map((opt, oIdx) => (
                        <span key={oIdx} className="block">
                          • {opt.groupName}: <span className="text-[#C99A8A]">{opt.optionName}</span>
                          {opt.extraPrice > 0 && ` (+${formatCurrency(opt.extraPrice)})`}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Special Notes */}
                  {cartItem.specialNotes && (
                    <span className="mt-1 text-[11px] text-[#D6A34A] italic">
                      Note: "{cartItem.specialNotes}"
                    </span>
                  )}
                </div>

                <button
                  onClick={() => removeItem(cartItem.id)}
                  className="text-[#A8A29E] hover:text-[#C96B6B] p-1.5 transition-colors"
                  title="Remove Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Price and Quantity Stepper */}
              <div className="flex items-center justify-between pt-2 border-t border-[#242424]">
                <span className="font-mono font-bold text-sm text-[#D8B58A]">
                  {formatCurrency(cartItem.itemTotal)}
                </span>

                <div className="flex items-center bg-[#242424] border border-[#2e2e2e] rounded-xl p-0.5">
                  <button
                    onClick={() => updateQuantity(cartItem.id, -1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#F6EFE7] hover:bg-[#171717]"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-xs font-semibold">
                    {cartItem.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(cartItem.id, 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#F6EFE7] hover:bg-[#171717]"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Customer Information & Special Cooking Instructions */}
        <div className="bg-[#171717] border border-[#242424] rounded-2xl p-4 sm:p-5 space-y-4">
          <h3 className="font-serif text-sm font-semibold text-[#F6EFE7] flex items-center gap-2">
            <User className="w-4 h-4 text-[#D8B58A]" />
            Guest Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#A8A29E] uppercase tracking-wider block mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Eleanor Vance"
                className="w-full bg-[#242424] border border-[#2e2e2e] focus:border-[#C99A8A] rounded-xl p-2.5 text-xs text-[#F6EFE7] outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#A8A29E] uppercase tracking-wider block mb-1">
                Phone (Optional for SMS receipt)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full bg-[#242424] border border-[#2e2e2e] focus:border-[#C99A8A] rounded-xl p-2.5 text-xs text-[#F6EFE7] outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="text-[11px] text-[#A8A29E] uppercase tracking-wider block mb-1">
              Overall Cooking Notes for Kitchen
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Please serve drinks first, extra napkins, serve coffee extra hot..."
              rows={2}
              className="w-full bg-[#242424] border border-[#2e2e2e] focus:border-[#C99A8A] rounded-xl p-2.5 text-xs text-[#F6EFE7] outline-none resize-none"
            />
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="bg-[#171717] border border-[#242424] rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#A8A29E]">
            <span>Item Subtotal</span>
            <span className="font-mono text-[#F6EFE7]">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-[#A8A29E]">
            <span>Taxes (5% GST)</span>
            <span className="font-mono text-[#F6EFE7]">{formatCurrency(tax)}</span>
          </div>

          <div className="pt-3 border-t border-[#242424] flex items-center justify-between">
            <span className="font-serif text-base font-semibold text-[#F6EFE7]">
              Total Amount
            </span>
            <span className="font-mono font-bold text-xl text-[#D8B58A]">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Submit Order Button */}
        <Button
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          onClick={handlePlaceOrder}
          className="w-full text-base font-semibold h-13 shadow-xl shadow-black/80"
        >
          <span>{t("place_order")}</span>
          <span className="ml-2">({formatCurrency(total)})</span>
        </Button>
      </main>
    </div>
  );
}

