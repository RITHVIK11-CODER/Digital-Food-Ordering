"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ShoppingBag, Clock, Receipt, User } from "lucide-react";
import { useCart } from "@/lib/store/cart-context";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { totalCount } = useCart();

  const navItems = [
    { label: "Menu", href: "/", icon: BookOpen },
    { label: "Cart", href: "/cart", icon: ShoppingBag, badge: totalCount > 0 ? totalCount : undefined },
    { label: "Track", href: "/track", icon: Clock },
    { label: "Bill", href: "/bill", icon: Receipt },
  ];

  // Only render on customer-facing pages
  if (
    pathname.startsWith("/chef") ||
    pathname.startsWith("/waiter") ||
    pathname.startsWith("/cashier") ||
    pathname.startsWith("/owner") ||
    pathname.startsWith("/staff")
  ) {
    return null;
  }

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-lg border-t border-[#242424] px-4 py-2 safe-area-pb">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive ? "text-[#D8B58A]" : "text-[#A8A29E] hover:text-[#F6EFE7]"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "text-[#D8B58A]" : ""}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-[#C99A8A] text-[#080808] text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-wide ${isActive ? "font-semibold" : "font-normal"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

