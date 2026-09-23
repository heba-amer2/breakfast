"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiCoffee,
  FiExternalLink,
  FiGrid,
  FiList,
  FiPhone,
  FiPlusCircle,
  FiSearch,
  FiTag,
} from "react-icons/fi";
import { LuUtensils } from "react-icons/lu";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { fetchRestaurants } from "@/features/restaurants/store/restaurantThunks";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";

export default function AdminRestaurantsPage() {
  const dispatch = useAppDispatch();
  const restaurants = useAppSelector((state) => state.restaurants.items);
  const error = useAppSelector((state) => state.restaurants.error);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  useAuthFetch(async () => {
    setLoading(true);
    await dispatch(fetchRestaurants());
    setLoading(false);
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return restaurants;

    return restaurants.filter((r) => {
      return (
        r.name.toLowerCase().includes(query) ||
        (r.phone ?? "").toLowerCase().includes(query)
      );
    });
  }, [restaurants, search]);

  const totalMenuItems = useMemo(() => {
    return restaurants.reduce((sum, r) => {
      const count =
        typeof r.menuItemCount === "number"
          ? r.menuItemCount
          : r.menu?.length ?? 0;
      return sum + count;
    }, 0);
  }, [restaurants]);

  const withPhoneCount = useMemo(() => {
    return restaurants.filter((r) => Boolean(r.phone && r.phone.trim())).length;
  }, [restaurants]);

  return (
    <>
      <TopBar
        title="Restaurant Partners"
        subtitle="Manage approved vendor directories and verified dish pricing histories."
        tag="ADMIN OPS"
        badge={
          restaurants.length > 0
            ? `${restaurants.length} vendor${restaurants.length === 1 ? "" : "s"}`
            : undefined
        }
        actions={
          <Link href="/admin/open-new-room">
            <Button variant="primary" size="sm">
              <span className="inline-flex items-center gap-1.5">
                <FiPlusCircle size={15} />
                Open Breakfast Room
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

        {/* Operational KPI Strip */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Approved Vendors
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                  {loading ? "—" : restaurants.length}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-800">
                <FiCoffee size={20} />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Active restaurants available for room creation
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Verified Dishes
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                  {loading ? "—" : totalMenuItems}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FiTag size={20} />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Verified price points from previous office receipts
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Phone Reachable
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                  {loading ? "—" : withPhoneCount}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <FiPhone size={20} />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Direct telephone contact verified for fast phone orders
            </p>
          </div>
        </div>

        {/* Filter and View Controls */}
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
              placeholder="Search vendor name or phone number…"
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
                onClick={() => setViewMode("table")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  viewMode === "table"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FiList size={14} />
                <span>Roster</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  viewMode === "grid"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FiGrid size={14} />
                <span>Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content presentation */}
        {loading ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <EmptyState
              title={search ? "No vendors match your search" : "No restaurant partners found"}
              description={
                search
                  ? `No restaurants match "${search}". Try searching another name or phone number.`
                  : "Approved restaurant vendors will appear here."
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
        ) : viewMode === "table" ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3.5">Vendor Name</th>
                    <th className="px-5 py-3.5">Contact Telephone</th>
                    <th className="px-5 py-3.5">Catalog Dishes</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((restaurant) => {
                    const dishCount =
                      typeof restaurant.menuItemCount === "number"
                        ? restaurant.menuItemCount
                        : restaurant.menu?.length ?? 0;

                    return (
                      <tr key={restaurant.id} className="group transition hover:bg-slate-50/80">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 shadow-xs group-hover:bg-emerald-100/70">
                              <LuUtensils size={18} />
                            </span>
                            <div>
                              <p className="font-semibold text-slate-900 group-hover:text-emerald-900">
                                {restaurant.name}
                              </p>
                              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                ID #{restaurant.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {restaurant.phone ? (
                            <a
                              href={`tel:${restaurant.phone}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              <FiPhone size={12} className="text-slate-400" />
                              {restaurant.phone}
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No phone registered</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                            <FiTag size={11} className="text-slate-400" />
                            {dishCount} verified {dishCount === 1 ? "dish" : "dishes"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/user/restaurants/${restaurant.id}`}>
                              <Button variant="secondary" size="sm">
                                <span className="inline-flex items-center gap-1">
                                  <span>View Menu</span>
                                  <FiExternalLink size={12} />
                                </span>
                              </Button>
                            </Link>
                            <Link href="/admin/open-new-room">
                              <Button variant="ghost" size="sm">
                                <span className="text-emerald-700 font-semibold">
                                  + Room
                                </span>
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((restaurant) => {
              const dishCount =
                typeof restaurant.menuItemCount === "number"
                  ? restaurant.menuItemCount
                  : restaurant.menu?.length ?? 0;

              return (
                <div
                  key={restaurant.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 shadow-xs">
                        <LuUtensils size={22} />
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                        {dishCount} items
                      </span>
                    </div>

                    <h3 className="mt-3 text-base font-bold text-slate-900">
                      {restaurant.name}
                    </h3>

                    <div className="mt-2">
                      {restaurant.phone ? (
                        <a
                          href={`tel:${restaurant.phone}`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-emerald-700"
                        >
                          <FiPhone size={13} className="text-slate-400" />
                          {restaurant.phone}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No phone registered</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <Link href={`/user/restaurants/${restaurant.id}`} className="w-full">
                      <Button fullWidth variant="secondary" size="sm">
                        <span className="inline-flex items-center gap-1.5">
                          <span>View Verified Menu</span>
                          <FiExternalLink size={13} />
                        </span>
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageContainer>
    </>
  );
}
