"use client";

import Link from "next/link";
import { FiCheckCircle, FiClock, FiPlus, FiShoppingBag } from "react-icons/fi";
import { getDishCategory, getDishIcon } from "@/lib/menuCategories";
import { formatMoney, formatVerifiedDate } from "@/lib/formatters";
import type { MenuItemDto } from "@/features/restaurants/store/restaurantSlice";

type MenuItemCardProps = {
  item: MenuItemDto;
  activeRoomId?: number | null;
  onAddToCart?: (item: MenuItemDto) => void;
  inCartCount?: number;
  readOnly?: boolean;
};

export function MenuItemCard({
  item,
  activeRoomId,
  onAddToCart,
  inCartCount = 0,
  readOnly = false,
}: MenuItemCardProps) {
  const category = getDishCategory(item.name);
  const icon = getDishIcon(item.name, 22);
  const verifiedDate = formatVerifiedDate(item.lastVerifiedAt);

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 food-card-hover hover:border-emerald-300 hover:shadow-md">
      <div>
        {/* Top bar: Icon & Badges */}
        <div className="flex items-start justify-between gap-2.5 mb-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-50 to-teal-50/80 text-emerald-800 ring-1 ring-emerald-200/70 shadow-2xs group-hover:scale-105 transition-transform duration-200">
            {icon}
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200/70">
              <FiCheckCircle size={11} className="text-emerald-600" />
              <span>Verified Price</span>
            </span>

            <span className="rounded-full bg-slate-100/90 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
              {category}
            </span>
          </div>
        </div>

        {/* Dish Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
          {item.name}
        </h3>

        {/* Verification meta */}
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
          <FiClock size={12} className="shrink-0 text-slate-400" />
          <span>
            {verifiedDate ? `Verified ${verifiedDate}` : "Verified from paper receipt"}
          </span>
        </p>
      </div>

      {/* Card Footer: Price & Order Action */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Price
          </span>
          <span className="text-lg font-extrabold tabular-nums text-emerald-700">
            {formatMoney(item.verifiedPrice)}
          </span>
        </div>

        {/* Contextual Action */}
        {!readOnly && onAddToCart ? (
          <button
            type="button"
            onClick={() => onAddToCart(item)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 cursor-pointer"
          >
            {inCartCount > 0 ? (
              <>
                <FiShoppingBag size={13} />
                <span>{inCartCount} in Cart</span>
              </>
            ) : (
              <>
                <FiPlus size={14} />
                <span>Add</span>
              </>
            )}
          </button>
        ) : !readOnly && activeRoomId ? (
          <Link
            href={`/user/rooms/${activeRoomId}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
          >
            <FiPlus size={13} />
            <span>Order in Room</span>
          </Link>
        ) : (
          <span className="rounded-xl bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
            {readOnly ? "Verified Price" : "Catalog Item"}
          </span>
        )}
      </div>
    </div>
  );
}

