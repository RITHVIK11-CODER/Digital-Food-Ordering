"use client";

import React, { useState, useEffect } from "react";
import { StaffHeader } from "@/components/layout/StaffHeader";
import { AnalyticsCard } from "@/components/ui/AnalyticsCard";
import { CafeTable, MenuItem, CafeSettings, User, Category } from "@/types/database.types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/EmptyState";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Utensils,
  QrCode,
  Users,
  Settings,
  Plus,
  Power,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Download,
  Printer,
  CheckCircle,
  X,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";
import QRCode from "qrcode";

export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState<"ANALYTICS" | "MENU" | "TABLES" | "STAFF" | "SETTINGS">("ANALYTICS");
  const [analytics, setAnalytics] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<CafeSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // New & Edit Menu Item modal
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItemPrice, setNewItemPrice] = useState<number>(250);
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemIsVeg, setNewItemIsVeg] = useState(true);
  const [newItemImageUrl, setNewItemImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Settings update state
  const [taxRateInput, setTaxRateInput] = useState<number>(5.0);
  const [prepTimeInput, setPrepTimeInput] = useState<number>(15);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // QR Modal
  const [selectedTableQR, setSelectedTableQR] = useState<{ table: CafeTable; dataUrl: string; url?: string } | null>(null);

  const fetchData = async () => {
    try {
      const [aRes, mRes, tRes, uRes, sRes] = await Promise.all([
        fetch("/api/analytics"),
        fetch("/api/menu"),
        fetch("/api/tables"),
        fetch("/api/users"),
        fetch("/api/settings"),
      ]);

      if (aRes.ok) setAnalytics(await aRes.json());
      if (mRes.ok) {
        const mData = await mRes.json();
        setMenuItems(mData.items || []);
        setCategories(mData.categories || []);
      }
      if (tRes.ok) setTables(await tRes.json());
      if (uRes.ok) setUsers(await uRes.json());
      if (sRes.ok) {
        const sData = await sRes.json();
        setSettings(sData);
        if (sData) {
          setTaxRateInput(sData.tax_rate ?? 5.0);
          setPrepTimeInput(sData.average_prep_time_minutes ?? 15);
        }
      }
    } catch (err) {
      console.error("Failed to load owner data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleItemAvailability = async (item: MenuItem) => {
    try {
      const res = await fetch(`/api/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: !item.is_available }),
      });

      if (res.ok) {
        const updated = await res.json();
        setMenuItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
        toast.success(`'${item.name}' marked as ${updated.is_available ? "Available" : "Sold Out"}`);
      }
    } catch {
      toast.error("Failed to toggle availability");
    }
  };

  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemCategory(item.category_id || "");
    setNewItemPrice(item.price);
    setNewItemDesc(item.description || "");
    setNewItemIsVeg(item.is_veg);
    setNewItemImageUrl(item.image_url || "");
    setIsNewItemModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setNewItemName("");
    setNewItemCategory(categories[0]?.id || "");
    setNewItemPrice(250);
    setNewItemDesc("");
    setNewItemIsVeg(true);
    setNewItemImageUrl("");
    setIsNewItemModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/menu/upload-image", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setNewItemImageUrl(data.imageUrl);
        toast.success("Image uploaded successfully!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to upload image");
      }
    } catch (err) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveMenuItem = async () => {
    if (!newItemName || !newItemCategory) {
      toast.error("Name and category are required");
      return;
    }

    try {
      if (editingItem) {
        // Update
        const res = await fetch(`/api/menu/${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newItemName,
            category_id: newItemCategory,
            description: newItemDesc,
            price: newItemPrice,
            is_veg: newItemIsVeg,
            image_url: newItemImageUrl || null,
          }),
        });

        if (res.ok) {
          const updated = await res.json();
          setMenuItems((prev) => prev.map((it) => (it.id === editingItem.id ? updated : it)));
          setIsNewItemModalOpen(false);
          toast.success("Dish updated successfully!");
        }
      } else {
        // Create
        const res = await fetch("/api/menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category_id: newItemCategory,
            name: newItemName,
            description: newItemDesc,
            price: newItemPrice,
            is_veg: newItemIsVeg,
            image_url: newItemImageUrl || null,
            is_available: true,
            is_bestseller: false,
            is_chef_special: false,
            preparation_time_minutes: 15,
          }),
        });

        if (res.ok) {
          const item = await res.json();
          setMenuItems((prev) => [item, ...prev]);
          setIsNewItemModalOpen(false);
          toast.success("New dish added to menu!");
        }
      }
    } catch {
      toast.error("Failed to save menu item");
    }
  };

  const handleDeleteMenuItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to remove "${itemName}" from the menu?`)) return;

    try {
      const res = await fetch(`/api/menu/${itemId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
        toast.success(`"${itemName}" removed from menu.`);
      } else {
        toast.error("Failed to delete menu item");
      }
    } catch {
      toast.error("Failed to delete menu item");
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tax_rate: Number(taxRateInput),
          average_prep_time_minutes: Number(prepTimeInput),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        toast.success("Operational settings updated successfully!");
      } else {
        toast.error("Failed to update settings");
      }
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleShowQR = async (table: CafeTable) => {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (typeof window !== "undefined" ? window.location.origin : "https://digital-food-ordering-82k6.vercel.app");
      const qrUrl = `${baseUrl.replace(/\/$/, "")}/table/${table.qr_code_token}`;
      const dataUrl = await QRCode.toDataURL(qrUrl, { width: 300, margin: 2 });
      setSelectedTableQR({ table, dataUrl, url: qrUrl });
    } catch (err) {
      toast.error("Failed to generate QR");
    }
  };

  const handleTogglePauseOrdering = async () => {
    if (!settings) return;
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_ordering_paused: !settings.is_ordering_paused }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        toast.info(updated.is_ordering_paused ? "Kitchen orders PAUSED" : "Kitchen orders ACTIVE");
      }
    } catch {
      toast.error("Failed to update settings");
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col text-[#F6EFE7]">
      <StaffHeader
        role="OWNER"
        staffName="Alexander Vance (Owner)"
        onRefresh={fetchData}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#242424] pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("ANALYTICS")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "ANALYTICS" ? "bg-[#D8B58A] text-[#080808]" : "bg-[#171717] text-[#A8A29E] hover:text-[#F6EFE7]"
            }`}
          >
            15-Day Analytics
          </button>
          <button
            onClick={() => setActiveTab("MENU")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "MENU" ? "bg-[#D8B58A] text-[#080808]" : "bg-[#171717] text-[#A8A29E] hover:text-[#F6EFE7]"
            }`}
          >
            Menu Management ({menuItems.length})
          </button>
          <button
            onClick={() => setActiveTab("TABLES")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "TABLES" ? "bg-[#D8B58A] text-[#080808]" : "bg-[#171717] text-[#A8A29E] hover:text-[#F6EFE7]"
            }`}
          >
            Tables & QR Codes ({tables.length})
          </button>
          <button
            onClick={() => setActiveTab("STAFF")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "STAFF" ? "bg-[#D8B58A] text-[#080808]" : "bg-[#171717] text-[#A8A29E] hover:text-[#F6EFE7]"
            }`}
          >
            Staff & Roles ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("SETTINGS")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "SETTINGS" ? "bg-[#D8B58A] text-[#080808]" : "bg-[#171717] text-[#A8A29E] hover:text-[#F6EFE7]"
            }`}
          >
            Cafe Operations
          </button>
        </div>

        {isLoading ? (
          <LoadingState message="Loading owner analytics & operations..." />
        ) : (
          <>
            {/* 15-DAY ANALYTICS TAB */}
            {activeTab === "ANALYTICS" && analytics && (
              <div className="space-y-6">
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <AnalyticsCard
                    title="Today's Revenue"
                    value={formatCurrency(analytics.today?.revenue || 0)}
                    subtitle="15-day Total: "
                    trend={{ value: "+18% vs avg", isPositive: true }}
                    icon={DollarSign}
                    highlightColor="gold"
                  />
                  <AnalyticsCard
                    title="Today's Orders"
                    value={analytics.today?.orders || 0}
                    subtitle={`15-day Total: ${analytics.fifteenDaysTotal?.orders || 0} orders`}
                    trend={{ value: "+12% peak", isPositive: true }}
                    icon={ShoppingBag}
                    highlightColor="rose"
                  />
                  <AnalyticsCard
                    title="Average Order Value"
                    value={formatCurrency(analytics.today?.averageOrderValue || 0)}
                    subtitle="Rolling 15-day benchmark"
                    icon={TrendingUp}
                    highlightColor="success"
                  />
                  <AnalyticsCard
                    title="Active Kitchen Load"
                    value={`${analytics.activeOrdersCount} orders`}
                    subtitle={`${analytics.preparingCount} in prep • ${analytics.readyCount} ready`}
                    icon={Utensils}
                    highlightColor="warning"
                  />
                </div>

                {/* 15-Day Rolling Revenue Trend Chart */}
                <div className="bg-[#171717] border border-[#242424] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
                    <div>
                      <h3 className="font-serif text-lg font-normal text-[#F6EFE7]">
                        Rolling 15-Day Revenue Trajectory
                      </h3>
                      <p className="text-xs text-[#A8A29E] mt-0.5">
                        Historical gross receipts aggregated from PostgreSQL order logs
                      </p>
                    </div>

                    <span className="font-mono font-bold text-sm text-[#D8B58A]">
                      15D Total: {formatCurrency(analytics.fifteenDaysTotal?.revenue || 0)}
                    </span>
                  </div>

                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.dailyTrend}>
                        <defs>
                          <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D8B58A" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#D8B58A" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#242424" vertical={false} />
                        <XAxis dataKey="date" stroke="#A8A29E" fontSize={11} tickLine={false} />
                        <YAxis stroke="#A8A29E" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#080808", borderColor: "#2e2e2e", borderRadius: "12px" }}
                          itemStyle={{ color: "#D8B58A", fontSize: "12px" }}
                          formatter={(value: any) => [`₹${value}`, "Revenue"]}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#D8B58A" strokeWidth={2} fillOpacity={1} fill="url(#goldGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Selling Items */}
                <div className="bg-[#171717] border border-[#242424] rounded-2xl p-5 space-y-4">
                  <h3 className="font-serif text-base font-normal text-[#F6EFE7]">
                    Top-Selling Culinary Delicacies (Past 15 Days)
                  </h3>

                  <div className="space-y-3">
                    {analytics.topSellingItems?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#242424]/40 border border-[#2e2e2e]">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-[#D8B58A]/15 text-[#D8B58A] font-bold flex items-center justify-center text-[11px]">
                            #{idx + 1}
                          </span>
                          <span className="font-medium text-[#F6EFE7]">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-4 font-mono">
                          <span className="text-[#A8A29E]">{item.count} sold</span>
                          <span className="text-[#D8B58A] font-bold">{formatCurrency(item.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MENU MANAGEMENT TAB */}
            {activeTab === "MENU" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-normal text-[#F6EFE7]">
                      Curated Menu Offerings
                    </h3>
                    <p className="text-xs text-[#A8A29E]">
                      Live availability toggles sync immediately with customer QR menus
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenAddModal}
                    className="text-xs gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Dish</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#171717] border border-[#242424] rounded-2xl p-4 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-16 h-16 rounded-xl object-cover border border-[#2e2e2e] flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-[#242424] border border-[#2e2e2e] flex items-center justify-center flex-shrink-0 text-xl">
                            ☕
                          </div>
                        )}
                        <div className="flex flex-col flex-1">
                          <div className="flex items-start justify-between">
                            <span className="font-serif text-sm font-medium text-[#F6EFE7]">
                              {item.name}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              item.is_veg 
                                ? "bg-green-950/40 text-green-400 border-green-800/40" 
                                : "bg-red-950/40 text-red-400 border-red-800/40"
                            }`}>
                              {item.is_veg ? "VEG" : "NON-VEG"}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-bold text-[#D8B58A] mt-0.5">
                            {formatCurrency(item.price)}
                          </span>
                          <span className="text-[10px] text-[#A8A29E] mt-1 line-clamp-1">
                            {item.description || "No description provided."}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#242424] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="text-[11px] text-[#A8A29E] hover:text-[#D8B58A] px-2 py-1 rounded bg-[#242424] hover:bg-[#2a2a2a] transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMenuItem(item.id, item.name)}
                            className="text-[11px] text-[#C96B6B] hover:text-red-400 px-2 py-1 rounded bg-[#242424] hover:bg-red-950/30 transition-colors"
                          >
                            Delete
                          </button>
                        </div>

                        <Button
                          variant={item.is_available ? "outline" : "primary"}
                          size="sm"
                          onClick={() => handleToggleItemAvailability(item)}
                          className="text-[11px] h-7 px-2.5"
                        >
                          {item.is_available ? "Mark Sold Out" : "Enable Item"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TABLES & QR CODES TAB */}
            {activeTab === "TABLES" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-normal text-[#F6EFE7]">
                      Table Management & QR Code Tokens
                    </h3>
                    <p className="text-xs text-[#A8A29E]">
                      Download or print QR codes to place on luxury table stands
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tables.map((table) => (
                    <div
                      key={table.id}
                      className="bg-[#171717] border border-[#242424] rounded-2xl p-5 flex items-center justify-between shadow-md"
                    >
                      <div>
                        <h4 className="font-serif text-base font-semibold text-[#F6EFE7]">
                          {table.table_number}
                        </h4>
                        <p className="text-xs text-[#A8A29E] mt-0.5">
                          Capacity: {table.capacity} guests • Token: {table.qr_code_token}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShowQR(table)}
                        className="gap-1.5 text-xs h-9 px-3 border-[#D8B58A]/30"
                      >
                        <QrCode className="w-4 h-4 text-[#D8B58A]" />
                        <span>View QR</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STAFF TAB */}
            {activeTab === "STAFF" && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-serif text-lg font-normal text-[#F6EFE7]">
                    Active Staff & Role-Based Access Control
                  </h3>
                  <p className="text-xs text-[#A8A29E]">
                    Enterprise RBAC enforcing station authorizations server-side
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users.map((usr) => (
                    <div
                      key={usr.id}
                      className="bg-[#171717] border border-[#242424] rounded-2xl p-4 space-y-2 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-sm font-semibold text-[#F6EFE7]">
                          {usr.full_name}
                        </span>
                        <span className="bg-[#D8B58A]/15 text-[#D8B58A] border border-[#D8B58A]/30 px-2 py-0.5 rounded text-[10px] font-bold">
                          {usr.role}
                        </span>
                      </div>
                      <p className="text-xs text-[#A8A29E]">{usr.email}</p>
                      <div className="pt-2 border-t border-[#242424] flex items-center justify-between text-xs text-[#A8A29E]">
                        <span>PIN Code: ••••</span>
                        <span className="text-[#6FAF82] font-semibold">Active</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SETTINGS / OPERATIONS TAB */}
            {activeTab === "SETTINGS" && settings && (
              <div className="bg-[#171717] border border-[#242424] rounded-2xl p-6 space-y-6 max-w-2xl">
                <div className="pb-3 border-b border-[#242424]">
                  <h3 className="font-serif text-lg font-normal text-[#F6EFE7]">
                    Operational Controls & GST Configuration
                  </h3>
                  <p className="text-xs text-[#A8A29E]">
                    Manage kitchen ordering pause, standard tax rates, and preparation time
                  </p>
                </div>

                {/* Pause Ordering Toggle */}
                <div className="flex items-center justify-between p-4 bg-[#242424]/40 rounded-xl border border-[#2e2e2e]">
                  <div>
                    <span className="font-semibold text-sm text-[#F6EFE7] block">
                      Kitchen Ordering Status
                    </span>
                    <span className="text-xs text-[#A8A29E]">
                      {settings.is_ordering_paused
                        ? "Currently PAUSED — Customers will see kitchen busy notice"
                        : "Currently ACTIVE — Customers can place orders freely"}
                    </span>
                  </div>

                  <Button
                    variant={settings.is_ordering_paused ? "primary" : "outline"}
                    size="sm"
                    onClick={handleTogglePauseOrdering}
                    className="text-xs"
                  >
                    {settings.is_ordering_paused ? "Resume Ordering" : "Pause Ordering"}
                  </Button>
                </div>

                {/* Tax & Prep time inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#242424]/40 p-4 rounded-xl border border-[#2e2e2e] space-y-2">
                    <label className="text-[#A8A29E] block text-xs font-medium">Standard GST Tax Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={taxRateInput}
                      onChange={(e) => setTaxRateInput(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#171717] border border-[#2e2e2e] rounded-lg p-2 text-sm text-[#F6EFE7] font-mono outline-none"
                    />
                    <p className="text-[10px] text-[#A8A29E]">Applied dynamically across all digital orders and bills.</p>
                  </div>

                  <div className="bg-[#242424]/40 p-4 rounded-xl border border-[#2e2e2e] space-y-2">
                    <label className="text-[#A8A29E] block text-xs font-medium">Average Prep Time (Minutes)</label>
                    <input
                      type="number"
                      value={prepTimeInput}
                      onChange={(e) => setPrepTimeInput(parseInt(e.target.value, 10) || 15)}
                      className="w-full bg-[#171717] border border-[#2e2e2e] rounded-lg p-2 text-sm text-[#F6EFE7] font-mono outline-none"
                    />
                    <p className="text-[10px] text-[#A8A29E]">Default estimated delivery time shown to guests.</p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                    className="text-xs"
                  >
                    {isSavingSettings ? "Saving Settings..." : "Save Operations Settings"}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* QR Code Inspection & Download Modal */}
      {selectedTableQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#171717] border border-[#2e2e2e] rounded-2xl p-6 shadow-2xl text-center space-y-4 text-[#F6EFE7]">
            <div className="flex items-center justify-between pb-2 border-b border-[#242424]">
              <h3 className="font-serif text-lg font-normal text-[#F6EFE7]">
                {selectedTableQR.table.table_number} QR Code
              </h3>
              <button
                onClick={() => setSelectedTableQR(null)}
                className="text-[#A8A29E] hover:text-[#F6EFE7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner mx-auto">
              <img src={selectedTableQR.dataUrl} alt="Table QR" className="w-48 h-48 mx-auto" />
            </div>

            <div className="space-y-1">
              <p className="text-xs text-[#D8B58A] font-mono">
                Token: {selectedTableQR.table.qr_code_token}
              </p>
              {selectedTableQR.url && (
                <p className="text-[11px] text-[#A8A29E] font-mono break-all bg-[#080808] p-2 rounded border border-[#242424]">
                  {selectedTableQR.url}
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              <a
                href={selectedTableQR.dataUrl}
                download={`${selectedTableQR.table.table_number}-QR.png`}
              >
                <Button variant="primary" size="sm" className="text-xs gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PNG</span>
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Menu Item Modal */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#171717] border border-[#2e2e2e] rounded-2xl p-6 shadow-2xl space-y-4 text-[#F6EFE7]">
            <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
              <h3 className="font-serif text-lg font-normal text-[#F6EFE7]">
                {editingItem ? `Edit "${editingItem.name}"` : "Add New Dish to Menu"}
              </h3>
              <button
                onClick={() => setIsNewItemModalOpen(false)}
                className="text-[#A8A29E] hover:text-[#F6EFE7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#A8A29E] block mb-1">Dish Name</label>
                <input
                  type="text"
                  placeholder="e.g. Pistachio Cardamom Latte"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-[#242424] border border-[#2e2e2e] rounded-xl p-2.5 text-xs text-[#F6EFE7] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#A8A29E] block mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full bg-[#242424] border border-[#2e2e2e] rounded-xl p-2.5 text-xs text-[#F6EFE7] outline-none"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#A8A29E] block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#242424] border border-[#2e2e2e] rounded-xl p-2.5 text-xs text-[#F6EFE7] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#A8A29E] block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Artisanal ingredients and tasting notes..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full bg-[#242424] border border-[#2e2e2e] rounded-xl p-2.5 text-xs text-[#F6EFE7] outline-none resize-none"
                />
              </div>

              {/* Dish Photo Upload */}
              <div>
                <label className="text-xs text-[#A8A29E] block mb-1">Dish Image / Photo</label>
                <div className="flex items-center gap-3">
                  {newItemImageUrl && (
                    <img
                      src={newItemImageUrl}
                      alt="Preview"
                      className="w-12 h-12 rounded-xl object-cover border border-[#2e2e2e]"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                    className="text-xs text-[#A8A29E] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-[#242424] file:text-[#D8B58A] file:cursor-pointer"
                  />
                </div>
                {isUploadingImage && <span className="text-[10px] text-[#D8B58A] mt-1 block">Uploading image...</span>}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="vegCheck"
                  checked={newItemIsVeg}
                  onChange={(e) => setNewItemIsVeg(e.target.checked)}
                  className="rounded border-[#2e2e2e] text-[#6FAF82]"
                />
                <label htmlFor="vegCheck" className="text-xs text-[#F6EFE7]">
                  Vegetarian Option
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-[#242424] flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNewItemModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveMenuItem}
                className="text-xs"
              >
                {editingItem ? "Update Dish" : "Save Dish"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



