"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiArrowRight,
  FiClock,
  FiGrid,
  FiList,
  FiPlusCircle,
  FiSearch,
  FiShoppingBag,
  FiTag,
  FiX,
} from "react-icons/fi";
import { LuUtensils } from "react-icons/lu";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { MenuItemCard } from "@/components/restaurants/menu-card";
import { MenuTable } from "@/components/restaurants/menu-table";
import { PhoneLink } from "@/components/shared/phone-link";
import { Button, CountdownTimer, EmptyState, Skeleton } from "@/components/ui";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import {
  fetchRestaurantById,
  fetchRestaurantMenu,
} from "@/features/restaurants/store/restaurantThunks";
import { fetchRooms } from "@/features/rooms/store/roomThunks";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import {
  getAvailableCategories,
  getCategoryIcon,
  getDishCategory,
  type DishCategory,
} from "@/lib/menuCategories";
import { formatMoney } from "@/lib/formatters";

type SortOption = "price-asc" | "price-desc" | "name";

export default function RestaurantDetailScreen() {
  const params = useParams<{ restaurantId: string }>();
  const restaurantId = Number(params.restaurantId);
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const restaurant = useAppSelector(
    (state) => state.restaurants.currentRestaurant,
  );
  const menu = useAppSelector((state) => state.restaurants.menu);
  const rooms = useAppSelector((state) => state.rooms.items);
  const error = useAppSelector((state) => state.restaurants.error);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<DishCategory>("All");
  const [sortKey, setSortKey] = useState<SortOption>("price-asc");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  useAuthFetch(async () => {
    if (!Number.isFinite(restaurantId)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    await Promise.all([
      dispatch(fetchRestaurantById(restaurantId)),
      dispatch(fetchRestaurantMenu(restaurantId)),
      dispatch(fetchRooms(undefined)),
    ]);
    setLoading(false);
  }, [restaurantId]);

  // Check if an active open breakfast room exists for this restaurant
  const activeRoom = useMemo(() => {
    return rooms.find(
      (r) =>
        r.restaurantId === restaurantId &&
        r.status === "OPEN" &&
        (typeof r.secondsRemaining !== "number" || r.secondsRemaining > 0),
    );
  }, [rooms, restaurantId]);

  // Dynamically extract categories that actually have items in this menu
  const availableCategories = useMemo(
    () => getAvailableCategories(menu),
    [menu],
  );

  // Filter & sort the menu items
  const filteredMenu = useMemo(() => {
    let list = menu;

    if (selectedCategory !== "All") {
      list = list.filter(
        (item) => getDishCategory(item.name) === selectedCategory,
      );
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((item) => item.name.toLowerCase().includes(q));
    }

    return [...list].sort((a, b) => {
      if (sortKey === "price-asc") return a.verifiedPrice - b.verifiedPrice;
      if (sortKey === "price-desc") return b.verifiedPrice - a.verifiedPrice;
      return a.name.localeCompare(b.name);
    });
  }, [menu, selectedCategory, search, sortKey]);

  // Calculate pricing metrics for the hero
  const priceRange = useMemo(() => {
    if (menu.length === 0) return null;
    const prices = menu.map((m) => m.verifiedPrice);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min, max };
  }, [menu]);

  const title = restaurant?.name ?? "Restaurant Menu";
  const backHref = user?.role === "ADMIN" ? "/admin/restaurants" : "/user/restaurants";

  return (
    <>
      <TopBar
        title={title}
        subtitle="Verified past-receipt pricing and dish catalog."
        tag="Restaurant Menu"
        actions={
          <div className="flex items-center gap-2">
            <Link href={backHref}>
              <Button variant="secondary" size="sm">
                <span className="inline-flex items-center gap-1.5">
                  <FiArrowLeft size={14} />
                  All Restaurants
                </span>
              </Button>
            </Link>

            {user?.role === "ADMIN" ? (
              <Link href="/admin/open-new-room">
                <Button size="sm">
                  <span className="inline-flex items-center gap-1.5">
                    <FiPlusCircle size={14} />
                    Open Room
                  </span>
                </Button>
              </Link>
            ) : null}
          </div>
        }
      />

      <PageContainer className="space-y-6 pb-12">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-sm">
            {error}
          </div>
        ) : null}

        {/* Restaurant Hero Card */}
        <div className="overflow-hidden rounded-3xl border border-emerald-200/90 bg-linear-to-br from-white via-emerald-50/20 to-emerald-50/40 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-100">
                <LuUtensils size={28} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-100/90 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                    Verified Partner
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    Direct Ordering Available
                  </span>
                </div>

                <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {loading ? "Loading restaurant…" : restaurant?.name ?? "Restaurant Not Found"}
                </h1>

                <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600">
                  {restaurant?.phone ? (
                    <div className="flex items-center gap-1.5">
                      <PhoneLink phone={restaurant.phone} />
                    </div>
                  ) : (
                    <span className="text-slate-400">No phone registered</span>
                  )}
                  {restaurant?.id ? (
                    <span className="text-xs text-slate-400">
                      Vendor ID #{restaurant.id}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-emerald-200/80 bg-white px-5 py-3 text-center shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Catalog Dishes
                </p>
                <p className="mt-0.5 text-2xl font-black tabular-nums text-slate-900">
                  {loading ? "—" : menu.length}
                </p>
              </div>

              {priceRange ? (
                <div className="rounded-2xl border border-slate-200/90 bg-white px-5 py-3 text-center shadow-2xs">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Price Range
                  </p>
                  <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-800">
                    {formatMoney(priceRange.min)} – {formatMoney(priceRange.max)}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Live Breakfast Room Active Banner (Order Flow Integration) */}
        {activeRoom ? (
          <div className="overflow-hidden rounded-3xl border-2 border-emerald-500 bg-linear-to-r from-emerald-600 to-teal-700 p-5 sm:p-6 text-white shadow-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-200 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                    Live Room Accepting Orders Now
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  Room #{activeRoom.id} is open for {restaurant?.name}!
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
                  {activeRoom.description ||
                    "Join your teammates and add dishes directly from this verified menu before ordering closes."}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-start sm:items-end gap-3">
                <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-xs">
                  <FiClock size={14} />
                  <span>Time left:</span>
                  <CountdownTimer
                    secondsRemaining={activeRoom.secondsRemaining}
                    expiresAt={activeRoom.expiresAt}
                    size="sm"
                  />
                </div>

                <Link href={`/user/rooms/${activeRoom.id}`}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-emerald-900 shadow-md transition hover:bg-emerald-50 hover:shadow-lg active:scale-95 cursor-pointer"
                  >
                    <FiShoppingBag size={15} />
                    <span>Join Room &amp; Order Dishes</span>
                    <FiArrowRight size={15} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {/* Menu Section Container */}
        <div className="space-y-4">
          {/* Section Heading & Category Filter Tabs */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Verified Menu Dishes</h2>
                <p className="text-xs text-slate-500">
                  {activeRoom
                    ? `Order any of these verified dishes directly into Room #${activeRoom.id}`
                    : "Prices auto-verified from actual past paper receipts."}
                </p>
              </div>

              {/* View Switcher: Cards vs Table */}
              <div className="inline-flex rounded-xl border border-slate-200/80 bg-white p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  aria-label="Cards view"
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    viewMode === "cards"
                      ? "bg-emerald-50 text-emerald-800 font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <FiGrid size={13} />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  aria-label="Table view"
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    viewMode === "table"
                      ? "bg-emerald-50 text-emerald-800 font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <FiList size={13} />
                  <span>Table</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills Bar */}
            {availableCategories.length > 1 ? (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {availableCategories.map(({ category, count }) => {
                  const isSelected = selectedCategory === category;
                  const icon = getCategoryIcon(category, 14);

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer select-none ${
                        isSelected
                          ? "bg-emerald-600 text-white font-bold shadow-xs"
                          : "border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {icon}
                      <span>{category}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums ${
                          isSelected
                            ? "bg-emerald-700 text-emerald-100"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Search & Sort Controls Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-md">
              <FiSearch
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dishes by name…"
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-slate-50/50 pl-9.5 pr-8 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <FiX size={14} />
                </button>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="text-xs font-medium text-slate-500">
                Showing {filteredMenu.length} of {menu.length}
              </span>

              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortOption)}
                aria-label="Sort dishes"
                className="h-10 rounded-xl border border-slate-200/90 bg-slate-50/50 px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 cursor-pointer"
              >
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Menu Items Presentation */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-3xl" />
              ))}
            </div>
          ) : filteredMenu.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xs">
              <EmptyState
                icon={<FiTag size={32} className="text-slate-400" />}
                title={
                  search.trim()
                    ? `No dishes match "${search}"`
                    : selectedCategory !== "All"
                      ? `No dishes in ${selectedCategory}`
                      : "Menu catalog is empty"
                }
                description={
                  search.trim() || selectedCategory !== "All"
                    ? "Try adjusting your search criteria or reset category filters."
                    : "This restaurant does not have verified menu items yet. When team members order custom items and an admin approves the paper receipt, dishes get automatically saved here!"
                }
                action={
                  search.trim() || selectedCategory !== "All" ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSearch("");
                        setSelectedCategory("All");
                      }}
                    >
                      Reset Filters
                    </Button>
                  ) : user?.role === "ADMIN" ? (
                    <Link href="/admin/open-new-room">
                      <Button size="sm">Open a Room to Start Ordering</Button>
                    </Link>
                  ) : undefined
                }
              />
            </div>
          ) : viewMode === "cards" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMenu.map((item, index) => (
                <MenuItemCard
                  key={item.id ?? `${item.name}-${index}`}
                  item={item}
                  activeRoomId={activeRoom?.id}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
              <MenuTable
                items={filteredMenu}
                loading={false}
                activeRoomId={activeRoom?.id}
              />
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
}
