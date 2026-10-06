"use client";

import React, { useState } from "react";
import { MenuItem } from "@/types/database.types";
import { formatCurrency } from "@/lib/utils";
import { useCart, SelectedCustomizationOption } from "@/lib/store/cart-context";
import { useLanguage } from "./LanguageSelector";
import { X, Plus, Minus, Check, Sparkles } from "lucide-react";
import { Button } from "./Button";

interface FoodCustomizerModalProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
}

export function FoodCustomizerModal({ item, isOpen, onClose }: FoodCustomizerModalProps) {
  const { t } = useLanguage();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [specialNotes, setSpecialNotes] = useState("");
  const [selectedOptionsMap, setSelectedOptionsMap] = useState<Record<string, SelectedCustomizationOption[]>>(() => {
    const initial: Record<string, SelectedCustomizationOption[]> = {};
    item.customization_groups?.forEach((grp) => {
      if (grp.is_required && grp.options && grp.options.length > 0) {
        // Default to first option for required groups
        initial[grp.name] = [
          {
            groupName: grp.name,
            optionName: grp.options[0].name,
            extraPrice: grp.options[0].extra_price,
          },
        ];
      } else {
        initial[grp.name] = [];
      }
    });
    return initial;
  });

  if (!isOpen) return null;

  const handleOptionToggle = (groupName: string, maxSelectable: number, optName: string, extraPrice: number) => {
    setSelectedOptionsMap((prev) => {
      const currentGroupSelections = prev[groupName] || [];
      const exists = currentGroupSelections.some((s) => s.optionName === optName);

      if (maxSelectable === 1) {
        return {
          ...prev,
          [groupName]: [{ groupName, optionName: optName, extraPrice }],
        };
      }

      if (exists) {
        return {
          ...prev,
          [groupName]: currentGroupSelections.filter((s) => s.optionName !== optName),
        };
      } else {
        if (currentGroupSelections.length < maxSelectable) {
          return {
            ...prev,
            [groupName]: [...currentGroupSelections, { groupName, optionName: optName, extraPrice }],
          };
        }
        return prev;
      }
    });
  };

  const flattenedOptions: SelectedCustomizationOption[] = Object.values(selectedOptionsMap).flat();
  const optionsTotal = flattenedOptions.reduce((acc, curr) => acc + Number(curr.extraPrice || 0), 0);
  const unitPrice = item.price + optionsTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    addItem(item, quantity, flattenedOptions, specialNotes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-[#171717] border border-[#2e2e2e] sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden text-[#F6EFE7]">
        {/* Modal Header */}
        <div className="relative h-44 sm:h-48 w-full bg-[#080808] overflow-hidden flex-shrink-0">
          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover opacity-80"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#171717] via-black/40 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white hover:bg-black/90 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="font-serif text-xl font-normal text-[#F6EFE7] drop-shadow-md">
              {item.name}
            </h2>
            <p className="text-xs text-[#D8B58A] mt-0.5">
              Base: {formatCurrency(item.price)}
            </p>
          </div>
        </div>

        {/* Scrollable Customizations Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {item.customization_groups?.map((group) => {
            const currentSelected = selectedOptionsMap[group.name] || [];
            const isSingle = group.max_selectable === 1;

            return (
              <div key={group.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold tracking-wide text-[#F6EFE7]">
                      {group.name}
                    </h4>
                    {group.is_required && (
                      <span className="text-[10px] uppercase font-bold text-[#C99A8A] bg-[#C99A8A]/10 px-1.5 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#A8A29E]">
                    {isSingle ? "Choose 1" : `Up to ${group.max_selectable}`}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {group.options?.map((opt) => {
                    const isSelected = currentSelected.some((s) => s.optionName === opt.name);

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          handleOptionToggle(group.name, group.max_selectable, opt.name, opt.extra_price)
                        }
                        className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-[#C99A8A]/15 border-[#C99A8A] text-[#F6EFE7]"
                            : "bg-[#242424]/60 border-[#2e2e2e] text-[#A8A29E] hover:border-[#3e3e3e]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? "border-[#C99A8A] bg-[#C99A8A]"
                                : "border-[#A8A29E]"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 text-[#080808]" />}
                          </div>
                          <span className="text-xs font-medium text-[#F6EFE7]">{opt.name}</span>
                        </div>

                        {opt.extra_price > 0 && (
                          <span className="text-xs font-semibold text-[#D8B58A]">
                            +{formatCurrency(opt.extra_price)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Special Cooking Instructions */}
          <div className="space-y-2 pt-2 border-t border-[#242424]">
            <label className="text-xs font-semibold text-[#F6EFE7] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D8B58A]" />
              {t("special_instructions")}
            </label>
            <textarea
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder={t("special_instructions_placeholder")}
              rows={2}
              maxLength={250}
              className="w-full rounded-xl bg-[#242424] border border-[#2e2e2e] focus:border-[#C99A8A] p-3 text-xs text-[#F6EFE7] placeholder-[#A8A29E]/60 outline-none resize-none transition-colors"
            />
          </div>
        </div>

        {/* Modal Footer: Quantity & Add Button */}
        <div className="p-4 bg-[#080808] border-t border-[#242424] flex items-center gap-4 flex-shrink-0">
          {/* Quantity Stepper */}
          <div className="flex items-center bg-[#242424] border border-[#2e2e2e] rounded-xl p-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#F6EFE7] hover:bg-[#171717] active:scale-95 transition-all"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-semibold text-[#F6EFE7]">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#F6EFE7] hover:bg-[#171717] active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart with live updated total */}
          <Button
            variant="primary"
            className="flex-1 h-11 text-sm font-semibold flex items-center justify-between px-5 shadow-lg shadow-black/80"
            onClick={handleAddToCart}
          >
            <span>Add to Order</span>
            <span>{formatCurrency(totalPrice)}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
