"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CafeLogo } from "@/components/brand/CafeLogo";
import { FoodCard } from "@/components/ui/FoodCard";
import { Category, MenuItem, CafeSettings } from "@/types/database.types";
import { useLanguage } from "@/components/ui/LanguageSelector";
import { useCart } from "@/lib/store/cart-context";
import { useRealtime } from "@/hooks/useRealtime";
import { Search, Sparkles, Flame, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { toast } from "sonner";

export default function CustomerMenuPage() {
  const { t } = useLanguage();
  const { totalCount, total, tableNumber, setTableInfo } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<CafeSettings | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVegOnly, setFilterVegOnly] = useState(false);
  const [filterChefSpecialOnly, setFilterChefSpecialOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial menu and settings
  const fetchData = async () => {
    try {
      const [menuRes, settingsRes, tablesRes] = await Promise.all([
        fetch("/api/menu"),
        fetch("/api/settings"),
        fetch("/api/tables"),
      ]);

      if (menuRes.ok) {
        const data = await menuRes.json();
        setCategories(data.categories || []);
        setMenuItems(data.items || []);
      }

      if (settingsRes.ok) {
        const setts = await settingsRes.json();
        setSettings(setts);
      }

      // If no table set yet, default to Table 1 for seamless customer demo
      if (tablesRes.ok) {
        const tbls = await tablesRes.json();
        if (tbls.length > 0 && !tableNumber) {
          const firstTbl = tbls[0];
          setTableInfo(firstTbl.id, firstTbl.table_number, `sess-${firstTbl.id}`);
        }
      }
    } catch (err) {
      console.error("Failed to load menu", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Realtime Menu & Settings Updates
  useRealtime({
    "menu.availability_changed": (updatedItem: MenuItem) => {
      setMenuItems((prev) =>
        prev.map((it) => (it.id === updatedItem.id ? updatedItem : it))
      );
    },
    "settings.updated": (newSettings: CafeSettings) => {
      setSettings(newSettings);
    },
  });

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategoryId === "ALL" || item.category_id === selectedCategoryId;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesVeg = filterVegOnly ? item.is_veg : true;
      const matchesChef = filterChefSpecialOnly ? item.is_chef_special : true;

      return matchesCategory && matchesSearch && matchesVeg && matchesChef;
    });
  }, [menuItems, selectedCategoryId, searchQuery, filterVegOnly, filterChefSpecialOnly]);

  const handleCallWaiter = async () => {
    try {
      await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: "c0000000-0000-0000-0000-000000000001",
          sessionId: "sess-default",
          requestType: "WAITER_CALL",
        }),
      });
      toast.success("Waiter has been notified to assist your table.");
    } catch {
      toast.error("Could not reach service desk.");
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col text-[#F6EFE7]">
      <CustomerHeader onCallWaiter={handleCallWaiter} />

      {/* Hero Banner with Velvet Bloom Branding */}
      <section className="relative w-full py-8 sm:py-12 px-4 bg-gradient-to-b from-[#171717] to-[#080808] border-b border-[#242424] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#C99A8A]/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto flex flex-col items-center text-center relative z-10">
          <CafeLogo size="lg" showTagline={true} showPoweredBy={true} />

          <p className="mt-3 text-xs sm:text-sm text-[#A8A29E] max-w-md font-light">
            An artisanal sanctuary for bespoke coffees, hand-rolled pastries, and wood-fired gourmet specialties.
          </p>

          {/* Kitchen Busy Announcement */}
          {settings?.is_ordering_paused && (
            <div className="mt-4 flex items-center gap-2 bg-[#D6A34A]/15 border border-[#D6A34A]/40 text-[#D6A34A] px-4 py-2 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{settings.busy_message || t("kitchen_busy")}</span>
            </div>
          )}
        </div>
      </section>

      {/* Search and Filters Bar */}
      <div className="sticky top-[61px] z-30 bg-[#080808]/95 backdrop-blur-md border-b border-[#242424] py-3 px-4 shadow-md">
        <div className="max-w-5xl mx-auto space-y-3">
          {/* Search Box */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search_placeholder")}
              className="w-full pl-10 pr-4 py-2.5 bg-[#171717] border border-[#2e2e2e] focus:border-[#C99A8A] rounded-xl text-xs text-[#F6EFE7] placeholder-[#A8A29E]/60 outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A8A29E] hover:text-[#F6EFE7]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Categories Horizontal Scroll & Dietary Quick Toggles */}
          <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 no-scrollbar">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setSelectedCategoryId("ALL")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategoryId === "ALL"
                    ? "bg-gradient-to-r from-[#C99A8A] to-[#D8B58A] text-[#080808] font-semibold shadow-md"
                    : "bg-[#171717] border border-[#242424] text-[#A8A29E] hover:text-[#F6EFE7]"
                }`}
              >
                All Curations
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategoryId === cat.id
                      ? "bg-gradient-to-r from-[#C99A8A] to-[#D8B58A] text-[#080808] font-semibold shadow-md"
                      : "bg-[#171717] border border-[#242424] text-[#A8A29E] hover:text-[#F6EFE7]"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Quick Badges */}
            <div className="flex items-center gap-1.5 flex-shrink-0 pl-2 border-l border-[#242424]">
              <button
                onClick={() => setFilterVegOnly(!filterVegOnly)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                  filterVegOnly
                    ? "bg-[#6FAF82]/20 border-[#6FAF82] text-[#6FAF82]"
                    : "bg-[#171717] border-[#242424] text-[#A8A29E]"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#6FAF82]" />
                Veg
              </button>

              <button
                onClick={() => setFilterChefSpecialOnly(!filterChefSpecialOnly)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                  filterChefSpecialOnly
                    ? "bg-[#C99A8A]/20 border-[#C99A8A] text-[#C99A8A]"
                    : "bg-[#171717] border-[#242424] text-[#A8A29E]"
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#C99A8A]" />
                Chef Pick
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Menu Grid */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6">
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center text-[#A8A29E]">
            <p className="font-serif text-lg text-[#F6EFE7]">No dishes match your selection</p>
            <p className="text-xs mt-1">Try clearing your search query or dietary filters.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSelectedCategoryId("ALL");
                setSearchQuery("");
                setFilterVegOnly(false);
                setFilterChefSpecialOnly(false);
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar for Mobile/Desktop */}
      {totalCount > 0 && (
        <div className="sticky bottom-16 sm:bottom-4 z-40 px-4 max-w-lg mx-auto w-full">
          <Link
            href="/cart"
            className="flex items-center justify-between bg-gradient-to-r from-[#C99A8A] to-[#D8B58A] text-[#080808] p-3.5 sm:p-4 rounded-2xl shadow-2xl shadow-black/80 hover:opacity-95 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#080808] text-[#D8B58A] flex items-center justify-center font-bold text-xs">
                {totalCount}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs uppercase font-bold tracking-wider opacity-80">
                  {t("view_cart")}
                </span>
                <span className="font-semibold text-sm">
                  {totalCount} {totalCount === 1 ? "item" : "items"} selected
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base sm:text-lg">
                ₹{total.toFixed(2)}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
