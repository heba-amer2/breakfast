"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FiCoffee, FiGrid, FiList, FiSearch, FiShoppingBag, FiTag } from "react-icons/fi";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { RestaurantCard } from "@/components/restaurants/restaurant-card";
import { RestaurantTable } from "@/components/restaurants/restaurant-table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { fetchRestaurants } from "@/features/restaurants/store/restaurantThunks";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";

export default function RestaurantsScreen() {
  const dispatch = useAppDispatch();
  const restaurants = useAppSelector((state) => state.restaurants.items);
  const error = useAppSelector((state) => state.restaurants.error);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  useAuthFetch(async () => {
    setLoading(true);
    await dispatch(fetchRestaurants());
    setLoading(false);
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return restaurants;

    return restaurants.filter((restaurant) => {
      return (
        restaurant.name.toLowerCase().includes(query) ||
        (restaurant.phone ?? "").toLowerCase().includes(query)
      );
    });
  }, [restaurants, search]);

  const totalMenuItems = useMemo(() => {
    return restaurants.reduce((sum, restaurant) => {
      const count =
        typeof restaurant.menuItemCount === "number"
          ? restaurant.menuItemCount
          : restaurant.menu?.length ?? 0;
      return sum + count;
    }, 0);
  }, [restaurants]);

  return (
    <>
      <TopBar
        title="Restaurant Partners"
        subtitle="Explore office-approved breakfast spots with verified price histories."
        tag="Directory"
        badge={
          restaurants.length > 0
            ? `${restaurants.length} partner${restaurants.length === 1 ? "" : "s"}`
            : undefined
        }
      />

      <PageContainer>
        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800 shadow-sm">
            {error}
          </div>
        ) : null}

        {/* Hero stat cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Approved Spots
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                  {loading ? "—" : restaurants.length}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100">
                <FiCoffee size={20} />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Curated eateries ready for breakfast orders
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Catalog Menu Items
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                  {loading ? "—" : totalMenuItems}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-900 text-emerald-100 shadow-xs">
                <FiTag size={20} />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Verified dish pricing from real office receipts
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Quick Ordering
                </p>
                <p className="mt-1 text-base font-bold text-slate-900">
                  Join a Live Room
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700 ring-1 ring-emerald-200/80">
                <FiShoppingBag size={20} />
              </div>
            </div>
            <div className="mt-2">
              <Link
                href="/user/rooms"
                className="inline-flex items-center text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Browse open rooms →
              </Link>
            </div>
          </div>
        </div>

        {/* Search and view toggle bar */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <FiSearch
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by restaurant name or phone…"
              className="h-10 w-full rounded-xl border border-slate-200/80 bg-slate-50/50 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="text-xs font-medium text-slate-500">
              Showing {filtered.length} of {restaurants.length}
            </span>

            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/70 p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  viewMode === "grid"
                    ? "bg-white text-slate-900 shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Grid View"
              >
                <FiGrid size={14} />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  viewMode === "table"
                    ? "bg-white text-slate-900 shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Table View"
              >
                <FiList size={14} />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content presentation */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-slate-100/70"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <EmptyState
              title={search ? "No matching restaurants" : "No restaurants found"}
              description={
                search
                  ? `No restaurants match "${search}". Try searching another name or phone number.`
                  : "Restaurants will appear here once added by an administrator."
              }
              action={
                search ? (
                  <Button variant="secondary" size="sm" onClick={() => setSearch("")}>
                    Clear search
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <RestaurantTable restaurants={filtered} loading={loading} />
          </div>
        )}
      </PageContainer>
    </>
  );
}
