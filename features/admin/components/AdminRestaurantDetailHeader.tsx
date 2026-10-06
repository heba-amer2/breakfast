"use client";

import Link from "next/link";
import { FiPlus } from "react-icons/fi";

import { PhoneLink } from "@/components/shared/phone-link";
import { Button } from "@/components/ui/button";
import type { RestaurantResponse } from "@/features/restaurants/store/restaurantSlice";

type AdminRestaurantDetailHeaderProps = {
  restaurant: RestaurantResponse;
  menuLength: number;
  loadingMenu: boolean;
  onAddMenuItem: () => void;
};

export function AdminRestaurantDetailHeader({
  restaurant,
  menuLength,
  loadingMenu,
  onAddMenuItem,
}: AdminRestaurantDetailHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-100/90 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200/70">
            Selected Restaurant
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
            Vendor ID #{restaurant.id}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {restaurant.name}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {restaurant.phone ? (
            <div className="flex items-center gap-1 text-slate-600">
              <PhoneLink phone={restaurant.phone} />
            </div>
          ) : (
            <span className="text-slate-400 italic">No phone registered</span>
          )}
          <span>&middot;</span>
          <span className="font-semibold text-emerald-800">
            {loadingMenu
              ? "Loading menu…"
              : `${menuLength} Verified Menu ${menuLength === 1 ? "Item" : "Items"}`}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <Link href={`/admin/restaurants/${restaurant.id}`}>
          <Button
            variant="secondary"
            size="sm"
            className="cursor-pointer shrink-0 w-full sm:w-auto min-h-[38px] sm:min-h-[36px] justify-center"
          >
            <span>View Full Page</span>
          </Button>
        </Link>

        <Button
          size="sm"
          onClick={onAddMenuItem}
          className="cursor-pointer shrink-0 w-full sm:w-auto min-h-[38px] sm:min-h-[36px] justify-center"
        >
          <span className="inline-flex items-center gap-1.5">
            <FiPlus size={14} />
            + Add Menu Item
          </span>
        </Button>
      </div>
    </div>
  );
}
