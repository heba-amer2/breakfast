"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiArrowLeft, FiSearch } from "react-icons/fi";
import { LuUtensils } from "react-icons/lu";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { MenuTable } from "@/components/restaurants/menu-table";
import { PhoneLink } from "@/components/shared/phone-link";
import { Button } from "@/components/ui";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import {
  fetchRestaurantById,
  fetchRestaurantMenu,
} from "@/features/restaurants/store/restaurantThunks";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";

export default function RestaurantDetailScreen() {
  const params = useParams<{ restaurantId: string }>();
  const restaurantId = Number(params.restaurantId);
  const dispatch = useAppDispatch();

  const restaurant = useAppSelector(
    (state) => state.restaurants.currentRestaurant,
  );
  const menu = useAppSelector((state) => state.restaurants.menu);
  const error = useAppSelector((state) => state.restaurants.error);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  useAuthFetch(async () => {
    if (!Number.isFinite(restaurantId)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    await Promise.all([
      dispatch(fetchRestaurantById(restaurantId)),
      dispatch(fetchRestaurantMenu(restaurantId)),
    ]);
    setLoading(false);
  }, [restaurantId]);

  const filteredMenu = useMemo(() => {
    const query = search.trim().toLowerCase();
    let items = menu.filter((item) =>
      query ? item.name.toLowerCase().includes(query) : true,
    );

    items = [...items].sort((a, b) =>
      sortAsc
        ? a.verifiedPrice - b.verifiedPrice
        : b.verifiedPrice - a.verifiedPrice,
    );

    return items;
  }, [menu, search, sortAsc]);

  const title = restaurant?.name ?? "Restaurant";

  return (
    <>
      <TopBar
        title={title}
        subtitle="Verified menu prices and historical order catalog."
        tag="Restaurant Menu"
        actions={
          <Link href="/user/restaurants">
            <Button variant="secondary" size="sm">
              <span className="inline-flex items-center gap-1.5">
                <FiArrowLeft size={14} />
                All Restaurants
              </span>
            </Button>
          </Link>
        }
      />

      <PageContainer>
        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800 shadow-sm">
            {error}
          </div>
        ) : null}

        {/* Restaurant Hero Card */}
        <div className="mb-6 overflow-hidden rounded-3xl border border-emerald-200/80 bg-linear-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                <LuUtensils size={28} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-100/90 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                    Verified Partner
                  </span>
                  {restaurant?.phone ? (
                    <span className="text-xs text-slate-500">
                      Direct Ordering Available
                    </span>
                  ) : null}
                </div>

                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                  {loading ? "Loading…" : restaurant?.name ?? "Restaurant Not Found"}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  {restaurant?.phone ? (
                    <div className="flex items-center gap-1.5">
                      <PhoneLink phone={restaurant.phone} />
                    </div>
                  ) : (
                    <span className="text-slate-400">No phone registered</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-emerald-200/70 bg-white/90 px-5 py-3 text-center shadow-xs">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Catalog Items
                </p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">
                  {loading ? "—" : menu.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Verified Dish Catalog</h2>
              <p className="text-xs text-slate-500">
                Prices automatically updated whenever an admin completes receipt entry.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="relative min-w-[220px]">
                <FiSearch
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search dishes…"
                  className="h-10 w-full rounded-xl border border-slate-200/80 bg-slate-50/50 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <button
                type="button"
                onClick={() => setSortAsc((value) => !value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200 cursor-pointer"
              >
                Price: {sortAsc ? "Lowest first ↑" : "Highest first ↓"}
              </button>
            </div>
          </div>

          <MenuTable items={filteredMenu} loading={loading} />
        </div>
      </PageContainer>
    </>
  );
}
