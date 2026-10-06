"use client";

import Link from "next/link";
import { FiShoppingBag } from "react-icons/fi";
import { LuUtensils } from "react-icons/lu";

import { Button } from "@/components/ui";
import type { MenuItemDto } from "@/features/restaurants/store/restaurantSlice";
import { formatMoney } from "@/lib/formatters";

type RoomMenuCatalogProps = {
  menu: MenuItemDto[];
  restaurantName: string;
  isOpen: boolean;
  roomId: number;
};

export function RoomMenuCatalog({
  menu,
  restaurantName,
  isOpen,
  roomId,
}: RoomMenuCatalogProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Restaurant Menu Catalog
            </h2>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
              {menu.length} {menu.length === 1 ? "dish" : "dishes"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dishes registered for {restaurantName} available for participants to order.
          </p>
        </div>

        {isOpen ? (
          <Link href={`/user/rooms/${roomId}`}>
            <Button size="sm" variant="secondary" className="cursor-pointer">
              <span className="inline-flex items-center gap-1.5">
                <FiShoppingBag size={13} />
                Go to Ordering
              </span>
            </Button>
          </Link>
        ) : null}
      </div>

      {menu.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
          No catalog dishes registered yet. Participants can order by entering custom dishes.
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {menu.map((dish, index) => (
            <div
              key={`${dish.name}-${index}`}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-emerald-200 hover:bg-emerald-50/30"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <LuUtensils size={14} />
                </div>
                <span className="truncate font-semibold text-sm text-slate-800">
                  {dish.name}
                </span>
              </div>
              <span className="shrink-0 font-bold tabular-nums text-emerald-800 text-sm ml-2">
                {formatMoney(dish.verifiedPrice ?? dish.price ?? 0)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

