"use client";

import {
  FiCheck,
  FiGrid,
  FiList,
  FiPlus,
  FiSearch,
  FiShield,
  FiTag,
  FiX,
} from "react-icons/fi";
import { LuUtensils } from "react-icons/lu";

import { MenuItemCard } from "@/components/restaurants/menu-card";
import { Button } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import type { MenuItemDto } from "@/features/restaurants/store/restaurantSlice";
import type { SortOption } from "@/features/rooms/hooks/useRoomOrdering";
import { formatMoney, formatVerifiedDate } from "@/lib/formatters";

type RoomMenuSectionProps = {
  loading: boolean;
  menu: MenuItemDto[];
  filteredMenu: MenuItemDto[];
  search: string;
  onSearchChange: (value: string) => void;
  sortKey: SortOption;
  onSortKeyChange: (value: SortOption) => void;
  viewMode: "cards" | "list";
  onViewModeChange: (mode: "cards" | "list") => void;
  onResetFilters: () => void;
  isOpen: boolean;
  cartItemCounts: Record<string, number>;
  addingMenuKey: string | null;
  addedItemKey: string | null;
  onAddMenuItem: (item: MenuItemDto) => void;
};

export function RoomMenuSection({
  loading,
  menu,
  filteredMenu,
  search,
  onSearchChange,
  sortKey,
  onSortKeyChange,
  viewMode,
  onViewModeChange,
  onResetFilters,
  isOpen,
  cartItemCounts,
  addingMenuKey,
  addedItemKey,
  onAddMenuItem,
}: RoomMenuSectionProps) {
  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs">
        {/* Header with Search, Sort, and View Switcher */}
        <div className="flex flex-col gap-3.5 border-b border-slate-100 p-4 sm:p-5 bg-slate-50/50">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Verified Restaurant Menu
              </h2>
              <p className="text-xs text-slate-500">
                {loading
                  ? "Loading catalog…"
                  : `${menu.length} verified dishes from past receipts`}
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="inline-flex rounded-xl border border-slate-200/80 bg-white p-1 shadow-2xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => onViewModeChange("cards")}
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
                onClick={() => onViewModeChange("list")}
                aria-label="List view"
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  viewMode === "list"
                    ? "bg-emerald-50 text-emerald-800 font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <FiList size={13} />
                <span>List</span>
              </button>
            </div>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between pt-1">
            <div className="relative flex-1 sm:max-w-xs">
              <FiSearch
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search menu items…"
                className="h-9.5 w-full rounded-xl border border-slate-200/90 bg-white pl-9.5 pr-8 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <FiX size={13} />
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-[11px] font-semibold text-slate-400">
                Sort:
              </span>
              <select
                value={sortKey}
                onChange={(e) => onSortKeyChange(e.target.value as SortOption)}
                aria-label="Sort menu items"
                className="h-9.5 rounded-xl border border-slate-200/90 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 cursor-pointer"
              >
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Menu Content: Loading, Empty, Cards, or List */}
        {loading ? (
          <div className="p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-44 w-full rounded-3xl" />
              ))}
            </div>
          </div>
        ) : menu.length === 0 ? (
          /* Empty State: When restaurant has no verified menu yet */
          <div className="p-8 text-center sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <FiTag size={26} />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900">
              No verified menu available yet.
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              This restaurant doesn&apos;t have verified catalog dishes yet.
              You can still order any breakfast dish using the custom dish form on the right!
            </p>
          </div>
        ) : filteredMenu.length === 0 ? (
          /* Filter/Search Empty State */
          <div className="p-8 text-center sm:p-10">
            <p className="text-sm font-semibold text-slate-700">
              No dishes match your search.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Try adjusting your search criteria.
            </p>
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-3 inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 cursor-pointer"
            >
              Reset Search
            </button>
          </div>
        ) : viewMode === "cards" ? (
          /* Cards View */
          <div className="grid gap-4 p-4 sm:p-5 sm:grid-cols-2">
            {filteredMenu.map((item, index) => (
              <MenuItemCard
                key={item.id ?? `${item.name}-${index}`}
                item={item}
                readOnly={!isOpen}
                onAddToCart={isOpen ? onAddMenuItem : undefined}
                inCartCount={cartItemCounts[item.name.toLowerCase()] || 0}
              />
            ))}
          </div>
        ) : (
          /* List View */
          <ul className="divide-y divide-slate-100">
            {filteredMenu.map((item, index) => {
              const inCartCount =
                cartItemCounts[item.name.toLowerCase()] || 0;
              const isJustAdded = addedItemKey === item.name;
              const verifiedDate = formatVerifiedDate(item.lastVerifiedAt);

              return (
                <li
                  key={item.id ?? `${item.name}-${index}`}
                  className="group flex items-center justify-between gap-4 p-4 transition-colors hover:bg-slate-50/70"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 shadow-2xs group-hover:bg-emerald-50 group-hover:text-emerald-800 transition-colors">
                      <LuUtensils size={18} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 truncate">
                          {item.name}
                        </p>
                        {inCartCount > 0 ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            {inCartCount} in cart
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-bold text-emerald-700 tabular-nums">
                          {formatMoney(item.verifiedPrice)}
                        </span>
                        {verifiedDate ? (
                          <>
                            <span>&middot;</span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                              <FiShield size={11} className="text-emerald-600" />
                              Verified {verifiedDate}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {isOpen ? (
                    <div className="shrink-0">
                      <Button
                        size="sm"
                        variant={inCartCount > 0 ? "secondary" : "primary"}
                        disabled={addingMenuKey === item.name}
                        onClick={() => onAddMenuItem(item)}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {isJustAdded ? (
                            <>
                              <FiCheck size={14} className="text-emerald-600" />
                              <span>Added!</span>
                            </>
                          ) : (
                            <>
                              <FiPlus size={14} />
                              <span>
                                {inCartCount > 0 ? "Add More" : "Add"}
                              </span>
                            </>
                          )}
                        </span>
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

