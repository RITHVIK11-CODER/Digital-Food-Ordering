"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MenuItem } from "@/types/database.types";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "./LanguageSelector";
import { Star, Clock, Flame, Sparkles, Plus } from "lucide-react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { FoodCustomizerModal } from "./FoodCustomizerModal";
import { useCart } from "@/lib/store/cart-context";

interface FoodCardProps {
  item: MenuItem;
}

export function FoodCard({ item }: FoodCardProps) {
  const { language, t } = useLanguage();
  const { addItem } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check for localized translation
  const translation = item.translations?.find((tr) => tr.language_code === language);
  const displayName = translation?.name || item.name;
  const displayDesc = translation?.description || item.description;

  const handleQuickAdd = () => {
    // If item has required customization groups, open modal
    const hasRequired = item.customization_groups?.some((g) => g.is_required);
    if (hasRequired || (item.customization_groups && item.customization_groups.length > 0)) {
      setIsModalOpen(true);
    } else {
      addItem(item, 1, [], "");
    }
  };

  return (
    <>
      <div className="group relative flex flex-col bg-[#171717] border border-[#242424] hover:border-[#C99A8A]/40 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/60">
        {/* Food Image */}
        <div className="relative w-full h-48 sm:h-52 bg-[#080808] overflow-hidden">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#171717] text-[#A8A29E]">
              <Sparkles className="w-8 h-8 opacity-40" />
            </div>
          )}

          {/* Gradient Overlay for luxury feel */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#171717] via-transparent to-black/30" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
            {/* Veg / Non-Veg Icon */}
            <div
              className={`w-5 h-5 rounded-md border flex items-center justify-center bg-[#080808]/90 ${
                item.is_veg ? "border-[#6FAF82]" : "border-[#C96B6B]"
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  item.is_veg ? "bg-[#6FAF82]" : "bg-[#C96B6B]"
                }`}
              />
            </div>

            {item.is_chef_special && (
              <Badge variant="rose" className="backdrop-blur-md bg-[#C99A8A]/20">
                <Sparkles className="w-3 h-3" />
                {t("chef_special")}
              </Badge>
            )}

            {item.is_bestseller && (
              <Badge variant="gold" className="backdrop-blur-md bg-[#D8B58A]/20">
                <Flame className="w-3 h-3" />
                {t("bestseller")}
              </Badge>
            )}
          </div>

          {/* Rating Badge */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-[#080808]/85 backdrop-blur-md border border-[#2e2e2e] px-2 py-0.5 rounded-full text-xs font-semibold text-[#F6EFE7]">
            <Star className="w-3.5 h-3.5 fill-[#D8B58A] text-[#D8B58A]" />
            <span>{item.average_rating.toFixed(1)}</span>
            <span className="text-[#A8A29E] text-[10px]">({item.total_reviews})</span>
          </div>
        </div>

        {/* Card Content */}
        <div className="flex flex-col flex-1 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-lg font-normal text-[#F6EFE7] group-hover:text-[#D8B58A] transition-colors leading-snug">
              {displayName}
            </h3>
          </div>

          <p className="mt-1.5 text-xs text-[#A8A29E] line-clamp-2 leading-relaxed flex-1">
            {displayDesc}
          </p>

          <div className="mt-3 flex items-center gap-3 text-[11px] text-[#A8A29E]">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#D8B58A]" />
              <span>{item.preparation_time_minutes} {t("prep_time")}</span>
            </div>
            {item.calories && (
              <span>• {item.calories} kcal</span>
            )}
          </div>

          {/* Footer with Price and Add Action */}
          <div className="mt-4 pt-3 border-t border-[#242424] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#A8A29E] uppercase tracking-wider">Price</span>
              <span className="font-semibold text-lg text-[#F6EFE7]">
                {formatCurrency(item.price)}
              </span>
            </div>

            {item.is_available ? (
              <Button
                size="sm"
                variant="primary"
                onClick={handleQuickAdd}
                className="gap-1.5 px-3.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{item.customization_groups && item.customization_groups.length > 0 ? "Customize" : "Add"}</span>
              </Button>
            ) : (
              <Badge variant="secondary">Sold Out</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Customizer Modal */}
      {isModalOpen && (
        <FoodCustomizerModal
          item={item}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

