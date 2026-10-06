"use client";

import { useRouter } from "next/navigation";
import { FiCoffee, FiPhone, FiPlus, FiSearch, FiX } from "react-icons/fi";
import { LuUtensils } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { RestaurantResponse } from "@/features/restaurants/store/restaurantSlice";

type AdminRestaurantsListProps = {
  loading: boolean;
  restaurants: RestaurantResponse[];
  filteredRestaurants: RestaurantResponse[];
  selectedRestaurantId: number | null;
  restaurantSearch: string;
  onSearchChange: (value: string) => void;
  onSelectRestaurant: (id: number) => void;
  onOpenAddModal: () => void;
};

export function AdminRestaurantsList({
  loading,
  restaurants,
  filteredRestaurants,
  selectedRestaurantId,
  restaurantSearch,
  onSearchChange,
  onSelectRestaurant,
  onOpenAddModal,
}: AdminRestaurantsListProps) {
  const router = useRouter();

  return (
    <section className="space-y-4 w-full min-w-0">
      <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Restaurants
            </h2>
            <p className="text-[11px] text-slate-400">
              {loading
                ? "Loading vendors…"
                : `${restaurants.length} registered ${restaurants.length === 1 ? "vendor" : "vendors"}`}
            </p>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={onOpenAddModal}
            className="cursor-pointer"
          >
            <span className="inline-flex items-center gap-1 text-xs">
              <FiPlus size={13} />
              <span>New</span>
            </span>
          </Button>
        </div>

        {/* Restaurant Search Input */}
        <div className="mt-3.5 relative">
          <FiSearch
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={restaurantSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search restaurants by name or phone…"
            className="h-9 w-full rounded-xl border border-slate-200/90 bg-slate-50/50 pl-8.5 pr-7 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />
          {restaurantSearch ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <FiX size={13} />
            </button>
          ) : null}
        </div>

        {/* Restaurant Items List */}
        <div className="mt-3.5 space-y-2 max-h-[280px] sm:max-h-[360px] lg:max-h-[580px] overflow-y-auto pr-1">
          {loading ? (
            <div className="space-y-2 py-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : restaurants.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <FiCoffee size={22} />
              </div>
              <p className="mt-3 text-xs font-bold text-slate-800">
                No restaurants yet.
              </p>
              <p className="mt-1 text-[11px] text-slate-400 max-w-xs mx-auto">
                Register your first restaurant partner to start cataloging verified dishes.
              </p>
              <Button
                size="sm"
                onClick={onOpenAddModal}
                className="mt-3 cursor-pointer"
              >
                <span className="inline-flex items-center gap-1">
                  <FiPlus size={13} />
                  + Add Restaurant
                </span>
              </Button>
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-xs font-semibold text-slate-600">
                No restaurants match &ldquo;{restaurantSearch}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="mt-2 text-xs font-bold text-emerald-800 underline cursor-pointer"
              >
                Clear search
              </button>
            </div>
          ) : (
            filteredRestaurants.map((restaurant) => {
              const isSelected = restaurant.id === selectedRestaurantId;
              const dishCount =
                typeof restaurant.menuItemCount === "number"
                  ? restaurant.menuItemCount
                  : restaurant.menu?.length ?? 0;

              return (
                <button
                  key={restaurant.id}
                  type="button"
                  onClick={() => {
                    onSelectRestaurant(restaurant.id);
                    if (typeof window !== "undefined" && window.innerWidth < 1024) {
                      router.push(`/admin/restaurants/${restaurant.id}`);
                    }
                  }}
                  className={`w-full text-left rounded-2xl p-3.5 transition-all duration-150 border cursor-pointer ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-400"
                      : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm transition-colors ${
                          isSelected
                            ? "bg-emerald-600 text-white shadow-2xs"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        <LuUtensils size={16} />
                      </span>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold truncate transition-colors ${
                            isSelected
                              ? "text-emerald-900"
                              : "text-slate-900"
                          }`}
                        >
                          {restaurant.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          ID #{restaurant.id}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums shrink-0 ${
                        isSelected
                          ? "bg-emerald-700 text-emerald-100"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {dishCount} {dishCount === 1 ? "dish" : "dishes"}
                    </span>
                  </div>

                  {restaurant.phone ? (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 pl-11">
                      <FiPhone size={11} className="text-slate-400 shrink-0" />
                      <span className="truncate">{restaurant.phone}</span>
                    </div>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
