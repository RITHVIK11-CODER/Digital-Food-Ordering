"use client";

import React, { useState, useEffect } from "react";
import { StaffHeader } from "@/components/layout/StaffHeader";
import { Bill, CafeTable, MenuItem, Order } from "@/types/database.types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useRealtime } from "@/hooks/useRealtime";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/EmptyState";
import { Search, Plus, Receipt, CreditCard, Banknote, QrCode, CheckCircle2, User, X } from "lucide-react";
import { toast } from "sonner";

export default function CashierDashboard() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"REQUESTED" | "PAID" | "ALL">("REQUESTED");
  const [isManualBillModalOpen, setIsManualBillModalOpen] = useState(false);
  const [selectedBillForPay, setSelectedBillForPay] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Manual Bill state
  const [manualTableId, setManualTableId] = useState("");
  const [manualCustomerName, setManualCustomerName] = useState("");
  const [manualCustomerPhone, setManualCustomerPhone] = useState("");
  const [manualSelectedItems, setManualSelectedItems] = useState<Array<{ menuItemId: string; quantity: number }>>([]);

  const fetchData = async () => {
    try {
      const [bRes, tRes, mRes, oRes] = await Promise.all([
        fetch("/api/bills", { cache: "no-store" }),
        fetch("/api/tables", { cache: "no-store" }),
        fetch("/api/menu", { cache: "no-store" }),
        fetch("/api/orders", { cache: "no-store" }),
      ]);

      if (bRes.ok) setBills(await bRes.json());
      if (tRes.ok) setTables(await tRes.json());
      if (mRes.ok) {
        const mData = await mRes.json();
        setMenuItems(mData.items || []);
      }
      if (oRes.ok) setOrders(await oRes.json());
    } catch (err) {
      console.error("Failed to load cashier data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Realtime updates
  useRealtime(
    {
      "bill.requested": (newBill: Bill) => {
        fetchData();
        toast.info(`🔔 Bill requested by ${newBill.table?.table_number || "Table"} (${formatCurrency(newBill.final_total)})`);
      },
      "payment.completed": () => fetchData(),
      "order.created": () => fetchData(),
      "order.additional_item_added": () => fetchData(),
      "order.served": () => fetchData(),
      "order.completed": () => fetchData(),
      "order.ready": () => fetchData(),
    },
    { onReconnect: fetchData }
  );

  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "7DAYS">("ALL");
  const [isSettling, setIsSettling] = useState(false);

  const handleSettlePayment = async (billId: string, method: "CASH" | "CARD" | "UPI") => {
    setIsSettling(true);
    try {
      const res = await fetch(`/api/bills/${billId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: method }),
      });

      if (res.ok) {
        const updated = await res.json();
        setBills((prev) => prev.map((b) => (b.id === billId ? updated : b)));
        setSelectedBillForPay(null);
        toast.success(`Bill #${updated.bill_number} settled with ${method}!`);
      } else {
        toast.error("Failed to settle bill");
      }
    } catch {
      toast.error("Failed to settle bill");
    } finally {
      setIsSettling(false);
    }
  };

  const handleCreateManualBill = async () => {
    if (!manualTableId || !manualCustomerName || manualSelectedItems.length === 0) {
      toast.error("Please select a table, enter customer name, and add at least one item.");
      return;
    }

    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isManual: true,
          tableId: manualTableId,
          customerName: manualCustomerName,
          customerPhone: manualCustomerPhone,
          items: manualSelectedItems,
          staffId: "b0000000-0000-0000-0000-000000000004",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBills((prev) => [data.bill, ...prev]);
        setIsManualBillModalOpen(false);
        setManualCustomerName("");
        setManualCustomerPhone("");
        setManualSelectedItems([]);
        toast.success("Manual bill created successfully!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create manual bill");
      }
    } catch {
      toast.error("Failed to create manual bill");
    }
  };

  const addManualItem = (menuItemId: string) => {
    setManualSelectedItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === menuItemId);
      if (existing) {
        return prev.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { menuItemId, quantity: 1 }];
    });
  };

  const filteredBills = bills.filter((b) => {
    // 1. Tab match
    const matchesTab =
      activeTab === "ALL" ||
      (activeTab === "REQUESTED" && b.status === "REQUESTED") ||
      (activeTab === "PAID" && b.status === "PAID");

    // 2. Date match
    let matchesDate = true;
    if (dateFilter === "TODAY") {
      const todayStr = new Date().toISOString().split("T")[0];
      matchesDate = b.created_at ? b.created_at.startsWith(todayStr) : true;
    } else if (dateFilter === "7DAYS") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      matchesDate = b.created_at ? b.created_at >= sevenDaysAgo : true;
    }

    // 3. Search match (Bill #, Table #, Customer Name, Order #)
    if (!searchQuery.trim()) {
      return matchesTab && matchesDate;
    }

    const q = searchQuery.toLowerCase().trim();
    const billNumMatch = b.bill_number?.toLowerCase().includes(q);
    const tableNumMatch = b.table?.table_number?.toLowerCase().includes(q);

    // Check associated orders for this table session
    const matchingOrders = orders.filter(
      (o) => (o.session_id === b.session_id || o.table_id === b.table_id) &&
        (o.customer_name?.toLowerCase().includes(q) || o.order_number?.toLowerCase().includes(q))
    );

    const matchesSearch = billNumMatch || tableNumMatch || matchingOrders.length > 0;
    return matchesTab && matchesDate && matchesSearch;
  });


  return (
    <div className="min-h-screen bg-[#080808] flex flex-col text-[#F6EFE7]">
      <StaffHeader
        role="CASHIER"
        staffName="David Miller (Cashier Desk)"
        onRefresh={fetchData}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Universal Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Bill #, Table, Customer..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#171717] border border-[#2e2e2e] focus:border-[#C99A8A] rounded-xl text-xs text-[#F6EFE7] placeholder-[#A8A29E]/60 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsManualBillModalOpen(true)}
              className="text-xs h-10 gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Manual Bill</span>
            </Button>
          </div>
        </div>

        {/* Tab & Date Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#242424] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("REQUESTED")}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "REQUESTED"
                  ? "bg-[#D8B58A] text-[#080808]"
                  : "bg-[#171717] text-[#A8A29E] hover:text-[#F6EFE7]"
              }`}
            >
              Pending Settlement ({bills.filter((b) => b.status === "REQUESTED").length})
            </button>
            <button
              onClick={() => setActiveTab("PAID")}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "PAID"
                  ? "bg-[#6FAF82] text-[#080808]"
                  : "bg-[#171717] text-[#A8A29E] hover:text-[#F6EFE7]"
              }`}
            >
              Settled Receipts ({bills.filter((b) => b.status === "PAID").length})
            </button>
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "ALL"
                  ? "bg-[#242424] text-[#F6EFE7]"
                  : "bg-[#171717] text-[#A8A29E] hover:text-[#F6EFE7]"
              }`}
            >
              All Bills ({bills.length})
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#A8A29E] text-[11px]">Period:</span>
            <button
              onClick={() => setDateFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                dateFilter === "ALL" ? "bg-[#D8B58A]/20 text-[#D8B58A] border border-[#D8B58A]/40" : "bg-[#171717] text-[#A8A29E]"
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateFilter("TODAY")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                dateFilter === "TODAY" ? "bg-[#D8B58A]/20 text-[#D8B58A] border border-[#D8B58A]/40" : "bg-[#171717] text-[#A8A29E]"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter("7DAYS")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                dateFilter === "7DAYS" ? "bg-[#D8B58A]/20 text-[#D8B58A] border border-[#D8B58A]/40" : "bg-[#171717] text-[#A8A29E]"
              }`}
            >
              Past 7 Days
            </button>
          </div>
        </div>


        {/* Bills Grid */}
        {isLoading ? (
          <LoadingState message="Loading billing records..." />
        ) : filteredBills.length === 0 ? (
          <div className="py-20 text-center text-[#A8A29E]">
            <Receipt className="w-12 h-12 mx-auto text-[#2e2e2e] mb-3" />
            <p className="font-serif text-lg text-[#F6EFE7]">No Bills in this View</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBills.map((bill) => (
              <div
                key={bill.id}
                className="bg-[#171717] border border-[#242424] rounded-2xl p-5 shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between pb-3 border-b border-[#242424]">
                    <div>
                      <span className="font-mono font-bold text-sm text-[#D8B58A]">
                        {bill.bill_number}
                      </span>
                      <span className="ml-2 bg-[#242424] text-[#F6EFE7] px-2 py-0.5 rounded text-xs font-semibold">
                        {bill.table?.table_number || "Table"}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        bill.status === "PAID"
                          ? "bg-[#6FAF82]/15 text-[#6FAF82] border border-[#6FAF82]/30"
                          : "bg-[#D6A34A]/15 text-[#D6A34A] border border-[#D6A34A]/30 animate-pulse"
                      }`}
                    >
                      {bill.status}
                    </span>
                  </div>

                  {/* Calculations */}
                  <div className="space-y-1.5 text-xs text-[#A8A29E]">
                    <div className="flex items-center justify-between">
                      <span>Subtotal:</span>
                      <span className="font-mono text-[#F6EFE7]">{formatCurrency(bill.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>GST (5%):</span>
                      <span className="font-mono text-[#F6EFE7]">{formatCurrency(bill.tax)}</span>
                    </div>
                    {bill.split_type === "EQUAL" && (
                      <div className="text-[11px] text-[#C99A8A]">
                        • Split {bill.split_count} ways ({formatCurrency(bill.final_total / bill.split_count)}/person)
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#242424] mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-[#A8A29E] tracking-wider block">
                      Total Due
                    </span>
                    <span className="font-mono font-bold text-base text-[#D8B58A]">
                      {formatCurrency(bill.final_total)}
                    </span>
                  </div>

                  {bill.status === "REQUESTED" ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedBillForPay(bill)}
                      className="text-xs"
                    >
                      Settle Payment
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-[#6FAF82] font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Settled</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Settle Payment Modal */}
      {selectedBillForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#171717] border border-[#2e2e2e] rounded-2xl p-6 shadow-2xl space-y-5 text-[#F6EFE7]">
            <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
              <div>
                <h3 className="font-serif text-lg font-normal text-[#F6EFE7]">
                  Settle Bill #{selectedBillForPay.bill_number}
                </h3>
                <span className="text-xs text-[#A8A29E]">
                  {selectedBillForPay.table?.table_number || "Table"}
                </span>
              </div>
              <button
                onClick={() => setSelectedBillForPay(null)}
                className="text-[#A8A29E] hover:text-[#F6EFE7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[#080808] rounded-xl border border-[#242424] text-center">
              <span className="text-xs text-[#A8A29E] uppercase tracking-wider">Amount to Collect</span>
              <p className="font-serif text-3xl font-bold text-[#D8B58A] mt-1">
                {formatCurrency(selectedBillForPay.final_total)}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-[#A8A29E] block mb-2 font-medium">
                Choose Payment Method:
              </span>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-11 border-[#D8B58A]/30 text-xs"
                onClick={() => handleSettlePayment(selectedBillForPay.id, "UPI")}
              >
                <QrCode className="w-4 h-4 text-[#D8B58A]" />
                <span>UPI / Static QR Code</span>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-11 border-[#C99A8A]/30 text-xs"
                onClick={() => handleSettlePayment(selectedBillForPay.id, "CARD")}
              >
                <CreditCard className="w-4 h-4 text-[#C99A8A]" />
                <span>Credit / Debit Card Terminal</span>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-11 border-[#6FAF82]/30 text-xs"
                onClick={() => handleSettlePayment(selectedBillForPay.id, "CASH")}
              >
                <Banknote className="w-4 h-4 text-[#6FAF82]" />
                <span>Cash Register</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Bill Creator Modal */}
      {isManualBillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] flex flex-col bg-[#171717] border border-[#2e2e2e] rounded-2xl shadow-2xl text-[#F6EFE7] overflow-hidden">
            <div className="p-5 border-b border-[#242424] flex items-center justify-between">
              <h3 className="font-serif text-lg font-normal text-[#F6EFE7]">
                Create New Manual Bill
              </h3>
              <button
                onClick={() => setIsManualBillModalOpen(false)}
                className="text-[#A8A29E] hover:text-[#F6EFE7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#A8A29E] block mb-1">Select Table</label>
                  <select
                    value={manualTableId}
                    onChange={(e) => setManualTableId(e.target.value)}
                    className="w-full bg-[#242424] border border-[#2e2e2e] rounded-xl p-2.5 text-xs text-[#F6EFE7] outline-none"
                  >
                    <option value="">-- Choose Table --</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.table_number} ({t.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#A8A29E] block mb-1">Customer Name</label>
                  <input
                    type="text"
                    placeholder="Guest Name"
                    value={manualCustomerName}
                    onChange={(e) => setManualCustomerName(e.target.value)}
                    className="w-full bg-[#242424] border border-[#2e2e2e] rounded-xl p-2.5 text-xs text-[#F6EFE7] outline-none"
                  />
                </div>
              </div>

              {/* Items Picker */}
              <div>
                <label className="text-xs text-[#A8A29E] block mb-1">Add Food & Drinks</label>
                <div className="max-h-40 overflow-y-auto space-y-1 bg-[#242424] p-2 rounded-xl border border-[#2e2e2e]">
                  {menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-1.5 hover:bg-[#171717] rounded-lg text-xs"
                    >
                      <span>{item.name} ({formatCurrency(item.price)})</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => addManualItem(item.id)}
                        className="h-6 px-2 text-[11px]"
                      >
                        + Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chosen Items */}
              {manualSelectedItems.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#242424]">
                  <span className="text-xs font-semibold text-[#D8B58A]">Selected Items:</span>
                  {manualSelectedItems.map((selected, sIdx) => {
                    const item = menuItems.find((m) => m.id === selected.menuItemId);
                    return (
                      <div key={sIdx} className="flex items-center justify-between text-xs bg-[#080808] p-2 rounded-lg">
                        <span>{item?.name} (Qty: {selected.quantity})</span>
                        <span className="font-mono text-[#D8B58A]">
                          {formatCurrency((item?.price || 0) * selected.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 bg-[#080808] border-t border-[#242424] flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsManualBillModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateManualBill}
                className="text-xs"
              >
                Generate & Print Bill
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

