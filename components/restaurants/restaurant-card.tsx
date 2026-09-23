import Link from "next/link";
import { FiArrowRight, FiCoffee, FiPhone } from "react-icons/fi";
import type { RestaurantResponse } from "@/features/restaurants/store/restaurantSlice";

type RestaurantCardProps = {
  restaurant: RestaurantResponse;
  href?: string;
  adminActions?: React.ReactNode;
};

export function RestaurantCard({
  restaurant,
  href,
  adminActions,
}: RestaurantCardProps) {
  const targetHref = href ?? `/user/restaurants/${restaurant.id}`;
  const menuCount =
    typeof restaurant.menuItemCount === "number"
      ? restaurant.menuItemCount
      : restaurant.menu?.length ?? 0;

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 food-card-hover hover:border-emerald-300">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-50 to-teal-50 text-emerald-700 ring-1 ring-emerald-200/70 shadow-2xs">
            <FiCoffee size={22} />
          </div>

          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {menuCount} {menuCount === 1 ? "dish" : "dishes"}
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
          {restaurant.name}
        </h3>

        {restaurant.phone ? (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-slate-500">
            <FiPhone size={12} className="text-slate-400" />
            <span>{restaurant.phone}</span>
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-slate-400">No phone listed</p>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100/90 pt-4">
        {adminActions ? (
          <div className="flex items-center gap-2">{adminActions}</div>
        ) : (
          <Link
            href={targetHref}
            className="inline-flex w-full items-center justify-between text-xs font-bold text-emerald-600 transition group-hover:text-emerald-700"
          >
            <span>Explore Verified Menu</span>
            <FiArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        )}
      </div>
    </div>
  );
}
