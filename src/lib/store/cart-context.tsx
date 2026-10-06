"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { MenuItem } from "@/types/database.types";
import { calculateOrderPricing } from "@/lib/pricing";

export interface SelectedCustomizationOption {
  groupName: string;
  optionName: string;
  extraPrice: number;
}

export interface CartItem {
  id: string; // Unique combination of itemId + selected options
  menuItem: MenuItem;
  quantity: number;
  selectedOptions: SelectedCustomizationOption[];
  specialNotes?: string;
  itemTotal: number;
}

interface CartContextType {
  items: CartItem[];
  tableId: string | null;
  sessionId: string | null;
  tableNumber: string | null;
  customerName: string;
  setTableInfo: (tableId: string, tableNumber: string, sessionId: string) => void;
  setCustomerName: (name: string) => void;
  addItem: (item: MenuItem, quantity: number, options?: SelectedCustomizationOption[], notes?: string) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  subtotal: number;
  tax: number;
  total: number;
  totalCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [tableId, setTableId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>("Valued Guest");

  // Load table and cart from local storage if available
  useEffect(() => {
    try {
      const savedTable = localStorage.getItem("vb_table_info");
      if (savedTable) {
        const parsed = JSON.parse(savedTable);
        setTableId(parsed.tableId);
        setTableNumber(parsed.tableNumber);
        setSessionId(parsed.sessionId);
      }
      const savedName = localStorage.getItem("vb_customer_name");
      if (savedName) setCustomerName(savedName);

      const savedCart = localStorage.getItem("vb_cart_items");
      if (savedCart) setItems(JSON.parse(savedCart));
    } catch {}
  }, []);

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem("vb_cart_items", JSON.stringify(items));
    } catch {}
  }, [items]);

  const setTableInfo = (tId: string, tNumber: string, sId: string) => {
    setTableId(tId);
    setTableNumber(tNumber);
    setSessionId(sId);
    try {
      localStorage.setItem("vb_table_info", JSON.stringify({ tableId: tId, tableNumber: tNumber, sessionId: sId }));
    } catch {}
  };

  const handleSetCustomerName = (name: string) => {
    setCustomerName(name);
    try {
      localStorage.setItem("vb_customer_name", name);
    } catch {}
  };

  const addItem = (
    menuItem: MenuItem,
    quantity: number,
    options: SelectedCustomizationOption[] = [],
    notes?: string
  ) => {
    const optionsExtraPrice = options.reduce((sum, opt) => sum + Number(opt.extraPrice || 0), 0);
    const unitPrice = Number(menuItem.price) + optionsExtraPrice;
    const cartItemId = `${menuItem.id}-${JSON.stringify(options)}-${notes || ""}`;

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === cartItemId);
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + quantity;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          itemTotal: unitPrice * newQty,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: cartItemId,
            menuItem,
            quantity,
            selectedOptions: options,
            specialNotes: notes,
            itemTotal: unitPrice * quantity,
          },
        ];
      }
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const optionsExtraPrice = item.selectedOptions.reduce(
              (sum, opt) => sum + Number(opt.extraPrice || 0),
              0
            );
            const unitPrice = Number(item.menuItem.price) + optionsExtraPrice;
            return {
              ...item,
              quantity: newQty,
              itemTotal: unitPrice * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem("vb_cart_items");
    } catch {}
  };

  // Compute calculated pricing
  const pricingInputs = items.map((i) => ({
    unitPrice: i.menuItem.price,
    quantity: i.quantity,
    optionsExtraPrice: i.selectedOptions.reduce((sum, opt) => sum + Number(opt.extraPrice || 0), 0),
  }));

  const pricing = calculateOrderPricing(pricingInputs, 5, 0, 0);
  const totalCount = items.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        tableId,
        sessionId,
        tableNumber,
        customerName,
        setTableInfo,
        setCustomerName: handleSetCustomerName,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        total: pricing.finalTotal,
        totalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

