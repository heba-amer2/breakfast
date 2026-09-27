"use client";

import React from "react";
import Link from "next/link";
import { FiCheckCircle, FiClock, FiHelpCircle, FiPlus } from "react-icons/fi";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatVerifiedDate } from "@/lib/formatters";
import { getDishCategory, getDishIcon } from "@/lib/menuCategories";
import type { MenuItemDto } from "@/features/restaurants/store/restaurantSlice";

type MenuTableProps = {
  items: MenuItemDto[];
  loading?: boolean;
  activeRoomId?: number | null;
  onAddToCart?: (item: MenuItemDto) => void;
  inCartCounts?: Record<string, number>;
  readOnly?: boolean;
};

export function MenuTable({
  items,
  loading,
  activeRoomId,
  onAddToCart,
  inCartCounts = {},
  readOnly = false,
}: MenuTableProps) {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="No menu items to display"
          description="This restaurant currently does not have menu items matching your filter or search."
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full sm:min-w-140 text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <th className="px-3 sm:px-5 py-3.5">Dish Item</th>
            <th className="hidden sm:table-cell px-5 py-3.5">Category</th>
            <th className="px-3 sm:px-5 py-3.5 font-bold text-slate-700">Verified Price</th>
            <th className="hidden md:table-cell px-5 py-3.5">Verification Date</th>
            <th className="px-3 sm:px-5 py-3.5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item, index) => {
            const verifiedOn = formatVerifiedDate(item.lastVerifiedAt);
            const icon = getDishIcon(item.name, 18);
            const category = getDishCategory(item.name);
            const inCart = inCartCounts[item.name.toLowerCase()] || 0;

            return (
              <tr
                key={item.id ?? `${item.name}-${index}`}
                className="group transition hover:bg-emerald-50/30"
              >
                <td className="px-3 sm:px-5 py-3.5">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm sm:text-base shadow-2xs group-hover:bg-emerald-50 group-hover:text-emerald-800 transition-colors">
                      {icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-1">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-1.5 sm:hidden text-[10px] text-slate-400">
                        <span className="font-medium text-slate-500">{category}</span>
                        {inCart > 0 ? (
                          <>
                            <span>&middot;</span>
                            <span className="font-bold text-emerald-700">{inCart} in order</span>
                          </>
                        ) : null}
                      </div>
                      {inCart > 0 ? (
                        <span className="hidden sm:inline-block text-[10px] font-bold text-emerald-700">
                          {inCart} in your order
                        </span>
                      ) : null}
                    </div>
                  </div>
                </td>

                <td className="hidden sm:table-cell px-5 py-3.5">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                    {category}
                  </span>
                </td>

                <td className="px-3 sm:px-5 py-3.5">
                  <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2 sm:px-2.5 py-1 text-xs sm:text-sm font-bold tabular-nums text-emerald-800 border border-emerald-100/80">
                    {formatMoney(item.verifiedPrice)}
                  </span>
                </td>

                <td className="hidden md:table-cell px-5 py-3.5 text-slate-500">
                  {verifiedOn ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                      <FiClock size={13} className="text-slate-400" />
                      {verifiedOn}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                      <FiHelpCircle size={13} />
                      Not verified yet
                    </span>
                  )}
                </td>

                <td className="px-3 sm:px-5 py-3.5 text-right">
                  {!readOnly && onAddToCart ? (
                    <button
                      type="button"
                      onClick={() => onAddToCart(item)}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 cursor-pointer"
                    >
                      <FiPlus size={13} />
                      <span>{inCart > 0 ? "Add More" : "Add"}</span>
                    </button>
                  ) : !readOnly && activeRoomId ? (
                    <Link
                      href={`/user/rooms/${activeRoomId}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
                    >
                      <FiPlus size={13} />
                      <span>Order</span>
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 sm:px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      <FiCheckCircle size={12} />
                      Verified
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
