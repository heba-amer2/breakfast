"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiCoffee,
  FiEdit2,
  FiHelpCircle,
  FiPhone,
  FiPlus,
  FiPlusCircle,
  FiRefreshCw,
  FiSearch,
  FiTag,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { LuUtensils } from "react-icons/lu";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PhoneLink } from "@/components/shared/phone-link";
import { RestaurantFormModal } from "@/components/admin/restaurant-form-modal";
import { MenuItemFormModal } from "@/components/admin/menu-item-form-modal";
import { DeleteMenuItemModal } from "@/components/admin/delete-menu-item-modal";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import {
  fetchRestaurants,
  fetchRestaurantMenu,
} from "@/features/restaurants/store/restaurantThunks";
import { formatMoney, formatVerifiedDate } from "@/lib/formatters";
import { getDishCategory, getDishIcon } from "@/lib/menuCategories";
import type { MenuItemDto } from "@/features/restaurants/store/restaurantSlice";

export default function AdminRestaurantsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const restaurants = useAppSelector((state) => state.restaurants.items);
  const menu = useAppSelector((state) => state.restaurants.menu);
  const error = useAppSelector((state) => state.restaurants.error);

  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [selectedIdOverride, setSelectedIdOverride] = useState<number | null>(null);
  const selectedRestaurantId =
    selectedIdOverride ?? (restaurants[0]?.id ?? null);

  // Search queries
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [menuSearch, setMenuSearch] = useState("");

  // Modals state
  const [isAddRestaurantOpen, setIsAddRestaurantOpen] = useState(false);
  const [itemModalConfig, setItemModalConfig] = useState<{
    isOpen: boolean;
    item: MenuItemDto | null;
  }>({
    isOpen: false,
    item: null,
  });
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    item: MenuItemDto | null;
  }>({
    isOpen: false,
    item: null,
  });

  // Success / info feedback banner
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Auto-dismiss feedback
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4500);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Initial load of all restaurants
  const loadRestaurants = async () => {
    setLoadingRestaurants(true);
    await dispatch(fetchRestaurants());
    setLoadingRestaurants(false);
  };

  useAuthFetch(loadRestaurants, []);

  // Load menu whenever selected restaurant changes
  useAuthFetch(async () => {
    if (!selectedRestaurantId) return;
    setLoadingMenu(true);
    await dispatch(fetchRestaurantMenu(selectedRestaurantId));
    setLoadingMenu(false);
  }, [selectedRestaurantId]);

  // Selected restaurant object
  const selectedRestaurant = useMemo(() => {
    return restaurants.find((r) => r.id === selectedRestaurantId) || null;
  }, [restaurants, selectedRestaurantId]);

  // Filtered restaurants based on search
  const filteredRestaurants = useMemo(() => {
    const query = restaurantSearch.trim().toLowerCase();
    if (!query) return restaurants;

    return restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        (r.phone ?? "").toLowerCase().includes(query),
    );
  }, [restaurants, restaurantSearch]);

  // Filtered menu items based on menu search
  const filteredMenu = useMemo(() => {
    const query = menuSearch.trim().toLowerCase();
    if (!query) return menu;

    return menu.filter((item) => item.name.toLowerCase().includes(query));
  }, [menu, menuSearch]);

  // Check admin role protection
  if (user && user.role !== "ADMIN") {
    return (
      <PageContainer className="p-8">
        <EmptyState
          title="Access Restricted"
          description="Only administrators can manage restaurants and menus."
        />
      </PageContainer>
    );
  }

  return (
    <>
      {/* Top Header */}
      <TopBar
        title="Restaurants & Menus"
        subtitle="Manage restaurants and their verified menus."
        tag="ADMIN OPS"
        badge={
          restaurants.length > 0
            ? `${restaurants.length} vendor${restaurants.length === 1 ? "" : "s"}`
            : undefined
        }
        actions={
          <Button
            size="sm"
            onClick={() => setIsAddRestaurantOpen(true)}
            className="cursor-pointer w-full sm:w-auto min-h-[38px] sm:min-h-[36px]"
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              <FiPlusCircle size={15} />
              + Add Restaurant
            </span>
          </Button>
        }
      />

      <PageContainer className="space-y-4 sm:space-y-6 pb-8 sm:pb-12">
        {/* Feedback Alert Banner */}
        {feedback ? (
          <div
            className={`flex items-center justify-between rounded-2xl border p-4 text-xs font-semibold shadow-xs transition-all ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <FiCheckCircle size={16} className="text-emerald-600" />
              ) : (
                <FiAlertCircle size={16} className="text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <FiX size={14} />
            </button>
          </div>
        ) : null}

        {/* Global Error Banner */}
        {error ? (
          <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 shadow-xs">
            <div className="flex items-center gap-2">
              <FiAlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadRestaurants}
              className="shrink-0"
            >
              <span className="inline-flex items-center gap-1">
                <FiRefreshCw size={12} />
                Retry
              </span>
            </Button>
          </div>
        ) : null}

        {/* 2-Column Master-Detail Layout */}
        <div className="grid gap-6 lg:grid-cols-[360px_1fr] items-start w-full min-w-0">
          {/* ========================================================= */}
          {/* LEFT / MASTER COLUMN: RESTAURANTS SECTION                 */}
          {/* ========================================================= */}
          <section className="space-y-4 w-full min-w-0">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Restaurants
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {loadingRestaurants
                      ? "Loading vendors…"
                      : `${restaurants.length} registered ${restaurants.length === 1 ? "vendor" : "vendors"}`}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsAddRestaurantOpen(true)}
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
                  onChange={(e) => setRestaurantSearch(e.target.value)}
                  placeholder="Search restaurants by name or phone…"
                  className="h-9 w-full rounded-xl border border-slate-200/90 bg-slate-50/50 pl-8.5 pr-7 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
                {restaurantSearch ? (
                  <button
                    type="button"
                    onClick={() => setRestaurantSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <FiX size={13} />
                  </button>
                ) : null}
              </div>

              {/* Restaurant Items List */}
              <div className="mt-3.5 space-y-2 max-h-[280px] sm:max-h-[360px] lg:max-h-[580px] overflow-y-auto pr-1">
                {loadingRestaurants ? (
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
                      onClick={() => setIsAddRestaurantOpen(true)}
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
                      onClick={() => setRestaurantSearch("")}
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
                          setSelectedIdOverride(restaurant.id);
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

          {/* ========================================================= */}
          {/* RIGHT / DETAIL COLUMN: SELECTED RESTAURANT & MENU SECTION */}
          {/* ========================================================= */}
          <section className="space-y-4 w-full min-w-0 hidden lg:block">
            {selectedRestaurant ? (
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5">
                {/* Selected Restaurant Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-100/90 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200/70">
                        Selected Restaurant
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                        Vendor ID #{selectedRestaurant.id}
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      {selectedRestaurant.name}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {selectedRestaurant.phone ? (
                        <div className="flex items-center gap-1 text-slate-600">
                          <PhoneLink phone={selectedRestaurant.phone} />
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No phone registered</span>
                      )}
                      <span>&middot;</span>
                      <span className="font-semibold text-emerald-800">
                        {loadingMenu
                          ? "Loading menu…"
                          : `${menu.length} Verified Menu ${menu.length === 1 ? "Item" : "Items"}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Link href={`/admin/restaurants/${selectedRestaurant.id}`}>
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
                      onClick={() =>
                        setItemModalConfig({ isOpen: true, item: null })
                      }
                      className="cursor-pointer shrink-0 w-full sm:w-auto min-h-[38px] sm:min-h-[36px] justify-center"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <FiPlus size={14} />
                        + Add Menu Item
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Menu Controls: Search */}
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1 sm:max-w-xs">
                    <FiSearch
                      size={14}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="search"
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      placeholder="Search menu dishes…"
                      className="h-9 w-full rounded-xl border border-slate-200/90 bg-slate-50/50 pl-8.5 pr-7 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                    />
                    {menuSearch ? (
                      <button
                        type="button"
                        onClick={() => setMenuSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <FiX size={13} />
                      </button>
                    ) : null}
                  </div>

                  <span className="text-xs font-medium text-slate-400">
                    Showing {filteredMenu.length} of {menu.length}
                  </span>
                </div>

                {/* Menu Table / List */}
                {loadingMenu ? (
                  <div className="space-y-2 py-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : menu.length === 0 ? (
                  /* Empty state for restaurant with no verified menu yet */
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-8 text-center sm:p-12">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100/70 text-emerald-800">
                      <FiTag size={22} />
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-slate-900">
                      No verified menu items yet.
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Add verified dishes to build this vendor&apos;s ordering catalog.
                      Team members will be able to order them directly in breakfast rooms.
                    </p>
                    <Button
                      size="sm"
                      onClick={() =>
                        setItemModalConfig({ isOpen: true, item: null })
                      }
                      className="mt-4 cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <FiPlus size={14} />
                        + Add Menu Item
                      </span>
                    </Button>
                  </div>
                ) : filteredMenu.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-xs font-semibold text-slate-700">
                      No menu items match &ldquo;{menuSearch}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={() => setMenuSearch("")}
                      className="mt-2 text-xs font-bold text-emerald-800 underline cursor-pointer"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Mobile Dishes Card List (sm:hidden) */}
                    <div className="space-y-3 sm:hidden">
                      {filteredMenu.map((item, index) => {
                        const icon = getDishIcon(item.name, 17);
                        const category = getDishCategory(item.name);
                        const verifiedDate = formatVerifiedDate(
                          item.lastVerifiedAt,
                        );

                        return (
                          <div
                            key={item.id ?? `${item.name}-${index}`}
                            className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs space-y-3 transition hover:border-slate-300"
                          >
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shadow-2xs">
                                  {icon}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-bold text-sm text-slate-900 truncate">
                                    {item.name}
                                  </p>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">
                                      {category}
                                    </span>
                                    {item.id ? <span>ID #{item.id}</span> : null}
                                  </div>
                                </div>
                              </div>

                              <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold tabular-nums text-emerald-800 border border-emerald-100 shrink-0">
                                {formatMoney(item.verifiedPrice)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                              <div className="text-[11px] text-slate-500">
                                {verifiedDate ? (
                                  <span className="inline-flex items-center gap-1 text-slate-600">
                                    <FiClock size={12} className="text-slate-400" />
                                    <span>{verifiedDate}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-slate-400 italic">
                                    <FiHelpCircle size={12} />
                                    <span>Unverified</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setItemModalConfig({
                                      isOpen: true,
                                      item,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition cursor-pointer min-h-[34px]"
                                >
                                  <FiEdit2 size={12} />
                                  <span>Edit</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteModalConfig({
                                      isOpen: true,
                                      item,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-xl bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition cursor-pointer min-h-[34px]"
                                >
                                  <FiTrash2 size={12} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Tablet & Desktop Dishes Table (hidden sm:block) */}
                    <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200/80 w-full min-w-0">
                      <table className="w-full min-w-[520px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            <th className="px-5 py-3.5">Dish Item</th>
                            <th className="px-4 py-3.5">Category</th>
                            <th className="px-4 py-3.5 font-bold text-slate-700">
                              Verified Price
                            </th>
                            <th className="px-4 py-3.5">Last Verified</th>
                            <th className="px-5 py-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredMenu.map((item, index) => {
                            const icon = getDishIcon(item.name, 17);
                            const category = getDishCategory(item.name);
                            const verifiedDate = formatVerifiedDate(
                              item.lastVerifiedAt,
                            );

                            return (
                              <tr
                                key={item.id ?? `${item.name}-${index}`}
                                className="group transition-colors hover:bg-slate-50/60"
                              >
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shadow-2xs group-hover:bg-emerald-50 group-hover:text-emerald-800 transition-colors">
                                      {icon}
                                    </span>
                                    <div>
                                      <p className="font-semibold text-slate-900 group-hover:text-emerald-900 transition-colors">
                                        {item.name}
                                      </p>
                                      {item.id ? (
                                        <span className="text-[10px] text-slate-400">
                                          ID #{item.id}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                </td>

                                <td className="px-4 py-3.5">
                                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                                    {category}
                                  </span>
                                </td>

                                <td className="px-4 py-3.5">
                                  <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold tabular-nums text-emerald-800 border border-emerald-100">
                                    {formatMoney(item.verifiedPrice)}
                                  </span>
                                </td>

                                <td className="px-4 py-3.5 text-xs text-slate-500">
                                  {verifiedDate ? (
                                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                                      <FiClock size={13} className="text-slate-400" />
                                      <span>{verifiedDate}</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 text-slate-400">
                                      <FiHelpCircle size={13} />
                                      <span>Not verified yet</span>
                                    </span>
                                  )}
                                </td>

                                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setItemModalConfig({
                                          isOpen: true,
                                          item,
                                        })
                                      }
                                      className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition cursor-pointer min-h-[32px]"
                                    >
                                      <FiEdit2 size={12} />
                                      <span>Edit</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDeleteModalConfig({
                                          isOpen: true,
                                          item,
                                        })
                                      }
                                      className="inline-flex items-center gap-1 rounded-xl bg-rose-50 hover:bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 transition cursor-pointer min-h-[32px]"
                                    >
                                      <FiTrash2 size={12} />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200/90 bg-white p-8 text-center shadow-xs">
                <EmptyState
                  title="No restaurant selected"
                  description="Choose a restaurant from the left list to view and manage its verified dishes."
                />
              </div>
            )}
          </section>
        </div>
      </PageContainer>

      {/* ========================================================= */}
      {/* MODALS                                                    */}
      {/* ========================================================= */}

      {/* Add Restaurant Modal */}
      {isAddRestaurantOpen ? (
        <RestaurantFormModal
          isOpen={isAddRestaurantOpen}
          onClose={() => setIsAddRestaurantOpen(false)}
          onSuccess={(created) => {
            setIsAddRestaurantOpen(false);
            setSelectedIdOverride(created.id);
            router.push(`/admin/restaurants/${created.id}`);
          }}
        />
      ) : null}

      {/* Add / Edit Menu Item Modal */}
      {selectedRestaurant ? (
        <MenuItemFormModal
          isOpen={itemModalConfig.isOpen}
          onClose={() => setItemModalConfig({ isOpen: false, item: null })}
          restaurantId={selectedRestaurant.id}
          item={itemModalConfig.item}
          onSuccess={(saved) => {
            setFeedback({
              type: "success",
              message: `Menu item "${saved.name}" saved at ${formatMoney(saved.verifiedPrice)}!`,
            });
          }}
        />
      ) : null}

      {/* Delete Menu Item Confirmation Modal */}
      {selectedRestaurant ? (
        <DeleteMenuItemModal
          isOpen={deleteModalConfig.isOpen}
          onClose={() => setDeleteModalConfig({ isOpen: false, item: null })}
          restaurantId={selectedRestaurant.id}
          item={deleteModalConfig.item}
          onSuccess={() => {
            setFeedback({
              type: "success",
              message: `Menu item "${deleteModalConfig.item?.name}" has been removed.`,
            });
          }}
        />
      ) : null}
    </>
  );
}
