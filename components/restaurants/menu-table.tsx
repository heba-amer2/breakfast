"use client";

import { FiCheckCircle, FiClock, FiHelpCircle } from "react-icons/fi";
import {
  LuCoffee,
  LuCookie,
  LuCroissant,
  LuCupSoda,
  LuEgg,
  LuSalad,
  LuSandwich,
  LuUtensils,
} from "react-icons/lu";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatVerifiedDate } from "@/lib/formatters";
import type { MenuItemDto } from "@/features/restaurants/store/restaurantSlice";

function getDishIcon(name: string): React.ReactNode {
  const lower = name.toLowerCase();
  if (
    lower.includes("coffee") ||
    lower.includes("latte") ||
    lower.includes("espresso") ||
    lower.includes("cappuccino")
  ) {
    return <LuCoffee size={16} className="text-emerald-800" />;
  }
  if (lower.includes("tea") || lower.includes("chai")) {
    return <LuCupSoda size={16} className="text-emerald-700" />;
  }
  if (
    lower.includes("croissant") ||
    lower.includes("pastry") ||
    lower.includes("danish") ||
    lower.includes("bakery")
  ) {
    return <LuCroissant size={16} className="text-emerald-700" />;
  }
  if (
    lower.includes("egg") ||
    lower.includes("omelet") ||
    lower.includes("scramble")
  ) {
    return <LuEgg size={16} className="text-emerald-700" />;
  }
  if (
    lower.includes("sandwich") ||
    lower.includes("toast") ||
    lower.includes("panini") ||
    lower.includes("burger")
  ) {
    return <LuSandwich size={16} className="text-emerald-800" />;
  }
  if (
    lower.includes("pancake") ||
    lower.includes("waffle") ||
    lower.includes("cookie") ||
    lower.includes("bagel")
  ) {
    return <LuCookie size={16} className="text-emerald-700" />;
  }
  if (
    lower.includes("salad") ||
    lower.includes("fruit") ||
    lower.includes("yogurt") ||
    lower.includes("bowl")
  ) {
    return <LuSalad size={16} className="text-emerald-700" />;
  }
  if (
    lower.includes("juice") ||
    lower.includes("smoothie") ||
    lower.includes("drink")
  ) {
    return <LuCupSoda size={16} className="text-emerald-700" />;
  }
  return <LuUtensils size={16} className="text-emerald-700" />;
}

type MenuTableProps = {
  items: MenuItemDto[];
  loading?: boolean;
};

export function MenuTable({ items, loading }: MenuTableProps) {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="Menu catalog is empty"
          description="This restaurant does not have verified menu items yet. When team members order custom items and an admin approves the receipt, dishes get automatically saved here!"
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[540px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <th className="px-5 py-3.5">Dish Item</th>
            <th className="px-5 py-3.5 font-semibold text-slate-700">Verified Price</th>
            <th className="px-5 py-3.5">Verification Date</th>
            <th className="px-5 py-3.5 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item, index) => {
            const verifiedOn = formatVerifiedDate(item.lastVerifiedAt);
            const icon = getDishIcon(item.name);

            return (
              <tr
                key={item.id ?? `${item.name}-${index}`}
                className="group transition hover:bg-emerald-50/40"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base shadow-xs group-hover:bg-white group-hover:shadow-sm">
                      {icon}
                    </span>
                    <span className="font-semibold text-slate-900 group-hover:text-emerald-900">
                      {item.name}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-bold tabular-nums text-emerald-700 border border-emerald-100/80">
                    {formatMoney(item.verifiedPrice)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-500">
                  {verifiedOn ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                      <FiClock size={13} className="text-slate-400" />
                      {verifiedOn}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <FiHelpCircle size={13} />
                      Not verified yet
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    <FiCheckCircle size={12} />
                    Verified
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
