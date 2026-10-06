"use client";

import React, { useState, useEffect } from "react";
import { StaffHeader } from "@/components/layout/StaffHeader";
import { CafeTable, Order, ServiceRequest, MenuItem } from "@/types/database.types";
import { TableBadge } from "@/components/ui/TableBadge";
import { OrderCard } from "@/components/ui/OrderCard";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/EmptyState";
import { useRealtime } from "@/hooks/useRealtime";
import { formatCurrency, formatTime } from "@/lib/utils";
import { Bell, CheckCircle2, Plus, Sparkles, Utensils, X, User } from "lucide-react";
import { toast } from "sonner";

export default function WaiterDashboard() {
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<CafeTable | null>(null);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [targetOrder, setTargetOrder] = useState<Order | null>(null);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>("");
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemNote, setItemNote] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [tRes, oRes, sRes, mRes] = await Promise.all([
        fetch("/api/tables"),
        fetch("/api/orders"),
        fetch("/api/service-requests"),
        fetch("/api/menu"),
      ]);

      if (tRes.ok) setTables(await tRes.json());
      if (oRes.ok) setOrders(await oRes.json());
      if (sRes.ok) setServiceRequests(await sRes.json());
      if (mRes.ok) {
        const mData = await mRes.json();
        setMenuItems(mData.items || []);
      }
    } catch (err) {
      console.error("Failed to load waiter dashboard", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Realtime updates
  useRealtime({
    "table.status_changed": (tbl: CafeTable) => {
      setTables((prev) => prev.map((t) => (t.id === tbl.id ? tbl : t)));
    },
    "service_request.created": (req: ServiceRequest) => {
      setServiceRequests((prev) => [req, ...prev]);
      toast.info(`🔔 Service request from ${req.table?.table_number || "Table"}: ${req.request_type}`);
    },
    "order.ready": (ord: Order) => {
      setOrders((prev) => prev.map((o) => (o.id === ord.id ? ord : o)));
      toast.success(`🍽️ Order #${ord.order_number} for ${ord.table?.table_number || "Table"} is ready to serve!`);
    },
    "order.created": (ord: Order) => {
      setOrders((prev) => [ord, ...prev]);
    },
  });

  const handleResolveServiceRequest = async (id: string) => {
    try {
      const res = await fetch("/api/service-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "COMPLETED" }),
      });
      if (res.ok) {
        setServiceRequests((prev) => prev.filter((r) => r.id !== id));
        toast.success("Request resolved.");
      }
    } catch {
      toast.error("Failed to resolve request");
    }
  };

  const handleMarkServed = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SERVED", actorType: "WAITER" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
        toast.success(`Order #${updated.order_number} marked as served!`);
      }
    } catch {
      toast.error("Failed to mark served");
    }
  };

  const handleAddAdditionalItem = async () => {
    if (!targetOrder || !selectedMenuItemId) return;

    try {
      const res = await fetch(`/api/orders/${targetOrder.id}/add-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuItemId: selectedMenuItemId,
          quantity: itemQty,
          specialNotes: itemNote,
          staffId: "b0000000-0000-0000-0000-000000000003",
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        setIsAddItemModalOpen(false);
        setItemQty(1);
        setItemNote("");
        toast.success("Additional item added and sent to Kitchen!");
      }
    } catch {
      toast.error("Failed to add item to order");
    }
  };

  const readyOrders = orders.filter((o) => o.status === "READY");
  const pendingRequests = serviceRequests.filter((r) => r.status === "PENDING");

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col text-[#F6EFE7]">
      <StaffHeader
        role="WAITER"
        staffName="Elena Rostova (Floor Lead)"
        onRefresh={fetchData}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-8">
        {/* Service Requests & Ready Orders Urgent Alert Banners */}
        {(pendingRequests.length > 0 || readyOrders.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Urgent Service Calls */}
            {pendingRequests.length > 0 && (
              <div className="bg-[#D6A34A]/10 border border-[#D6A34A]/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#D6A34A] uppercase tracking-wider flex items-center gap-1.5">
                    <Bell className="w-4 h-4" />
                    Guest Assistance ({pendingRequests.length})
                  </span>
                </div>

                <div className="space-y-2">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#171717] border border-[#2e2e2e] text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[#F6EFE7]">
                          {req.table?.table_number || "Table"}: {req.request_type}
                        </span>
                        {req.notes && (
                          <span className="text-[11px] text-[#A8A29E] block">
                            "{req.notes}"
                          </span>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleResolveServiceRequest(req.id)}
                        className="text-xs h-7 px-2.5"
                      >
                        Attend
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ready for Pickup / Delivery */}
            {readyOrders.length > 0 && (
              <div className="bg-[#6FAF82]/10 border border-[#6FAF82]/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#6FAF82] uppercase tracking-wider flex items-center gap-1.5">
                    <Utensils className="w-4 h-4" />
                    Ready for Serving ({readyOrders.length})
                  </span>
                </div>

                <div className="space-y-2">
                  {readyOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#171717] border border-[#2e2e2e] text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#D8B58A]">
                          #{ord.order_number}
                        </span>
                        <span className="ml-2 font-medium text-[#F6EFE7]">
                          {ord.table?.table_number || "Table"} ({ord.items?.length} items)
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleMarkServed(ord.id)}
                        className="text-xs h-7 px-3"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Mark Served
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floor Table Map */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-normal text-[#F6EFE7]">
                Floor Layout & Tables
              </h2>
              <p className="text-xs text-[#A8A29E]">
                Select a table to view active guest orders and add items
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {tables.map((table) => {
              const tableOrders = orders.filter(
                (o) => o.table_id === table.id && !["COMPLETED", "CANCELLED"].includes(o.status)
              );
              return (
                <TableBadge
                  key={table.id}
                  table={table}
                  activeOrdersCount={tableOrders.length}
                  isSelected={selectedTable?.id === table.id}
                  onClick={() => setSelectedTable(table)}
                />
              );
            })}
          </div>
        </section>

        {/* Selected Table Active Orders View */}
        {selectedTable && (
          <section className="bg-[#171717] border border-[#242424] rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
              <div>
                <h3 className="font-serif text-lg font-medium text-[#F6EFE7]">
                  {selectedTable.table_number} — Active Orders
                </h3>
                <span className="text-xs text-[#A8A29E]">
                  Status: {selectedTable.status} • Capacity: {selectedTable.capacity}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTable(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>

            {/* Orders for this table */}
            {(() => {
              const tableOrders = orders.filter(
                (o) => o.table_id === selectedTable.id && !["COMPLETED", "CANCELLED"].includes(o.status)
              );

              if (tableOrders.length === 0) {
                return (
                  <p className="text-xs text-[#A8A29E] py-4 text-center">
                    No active orders for this table.
                  </p>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tableOrders.map((ord) => (
                    <OrderCard
                      key={ord.id}
                      order={ord}
                      userRole="WAITER"
                      onStatusChange={handleMarkServed}
                      onAddItemClick={(order) => {
                        setTargetOrder(order);
                        setIsAddItemModalOpen(true);
                      }}
                    />
                  ))}
                </div>
              );
            })()}
          </section>
        )}
      </main>

      {/* Add Item Modal */}
      {isAddItemModalOpen && targetOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#171717] border border-[#2e2e2e] rounded-2xl p-6 shadow-2xl space-y-4 text-[#F6EFE7]">
            <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
              <h3 className="font-serif text-lg font-normal text-[#F6EFE7]">
                Add Item to #{targetOrder.order_number}
              </h3>
              <button
                onClick={() => setIsAddItemModalOpen(false)}
                className="text-[#A8A29E] hover:text-[#F6EFE7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#A8A29E] block mb-1">Select Menu Dish</label>
                <select
                  value={selectedMenuItemId}
                  onChange={(e) => setSelectedMenuItemId(e.target.value)}
                  className="w-full bg-[#242424] border border-[#2e2e2e] rounded-xl p-2.5 text-xs text-[#F6EFE7] outline-none"
                >
                  <option value="">-- Choose item --</option>
                  {menuItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({formatCurrency(item.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-1/3">
                  <label className="text-xs text-[#A8A29E] block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={itemQty}
                    onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#242424] border border-[#2e2e2e] rounded-xl p-2.5 text-xs text-[#F6EFE7] outline-none"
                  />
                </div>

                <div className="flex-1">
                  <label className="text-xs text-[#A8A29E] block mb-1">Special Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Extra hot, no ice..."
                    value={itemNote}
                    onChange={(e) => setItemNote(e.target.value)}
                    className="w-full bg-[#242424] border border-[#2e2e2e] rounded-xl p-2.5 text-xs text-[#F6EFE7] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#242424] flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddItemModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!selectedMenuItemId}
                onClick={handleAddAdditionalItem}
                className="text-xs"
              >
                Add & Send to Kitchen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
