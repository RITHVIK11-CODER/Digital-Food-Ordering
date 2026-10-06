import React from "react";
import { CafeTable } from "@/types/database.types";
import { TableStatusBadge } from "./StatusBadge";
import { Users } from "lucide-react";

interface TableBadgeProps {
  table: CafeTable;
  activeOrdersCount?: number;
  onClick?: () => void;
  isSelected?: boolean;
}

export function TableBadge({ table, activeOrdersCount = 0, onClick, isSelected }: TableBadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col p-4 rounded-2xl border text-left transition-all duration-200 ${
        isSelected
          ? "bg-[#C99A8A]/15 border-[#C99A8A] ring-2 ring-[#C99A8A]/40 shadow-lg shadow-black/60"
          : "bg-[#171717] border-[#242424] hover:border-[#3a3a3a] hover:bg-[#1c1c1c]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-serif text-base font-medium text-[#F6EFE7]">
          {table.table_number}
        </span>
        <TableStatusBadge status={table.status} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-[#A8A29E]">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[#D8B58A]" />
          <span>Cap: {table.capacity} guests</span>
        </div>

        {activeOrdersCount > 0 && (
          <span className="bg-[#D8B58A]/15 text-[#D8B58A] font-semibold px-2 py-0.5 rounded-full text-[11px]">
            {activeOrdersCount} {activeOrdersCount === 1 ? "order" : "orders"}
          </span>
        )}
      </div>
    </button>
  );
}
