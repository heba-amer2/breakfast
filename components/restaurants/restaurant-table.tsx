"use client";

import Link from "next/link";
import { FiArrowRight, FiCoffee } from "react-icons/fi";

import { PhoneLink } from "@/components/shared/phone-link";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { RestaurantResponse } from "@/features/restaurants/store/restaurantSlice";

type RestaurantTableProps = {
  restaurants: RestaurantResponse[];
  loading?: boolean;
};

export function RestaurantTable({ restaurants, loading }: RestaurantTableProps) {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<FiCoffee size={28} />}
          title="No restaurants found"
          description="Restaurants and their verified menus will appear here once registered."
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <th className="px-5 py-3">Restaurant</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Menu Items</th>
            <th className="px-5 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {restaurants.map((restaurant) => (
            <tr
              key={restaurant.id}
              className="group transition-colors hover:bg-slate-50/80"
            >
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100 shadow-2xs">
                    <FiCoffee size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {restaurant.name}
                    </p>
                    <p className="text-[11px] text-slate-400">ID #{restaurant.id}</p>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3.5 text-xs text-slate-600">
                <PhoneLink phone={restaurant.phone} />
              </td>

              <td className="px-4 py-3.5 whitespace-nowrap">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {typeof restaurant.menuItemCount === "number"
                    ? `${restaurant.menuItemCount} items`
                    : `${restaurant.menu?.length ?? 0} items`}
                </span>
              </td>

              <td className="px-5 py-3.5 text-right whitespace-nowrap">
                <Link
                  href={`/user/restaurants/${restaurant.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                >
                  <span>View Menu</span>
                  <FiArrowRight size={13} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
