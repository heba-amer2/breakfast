"use client";

import {
  FiClock,
  FiEdit2,
  FiHelpCircle,
  FiPlus,
  FiSearch,
  FiTag,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { LuUtensils } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { MenuItemDto } from "@/features/restaurants/store/restaurantSlice";
import { formatMoney, formatVerifiedDate } from "@/lib/formatters";

type AdminRestaurantMenuItemsProps = {
  menu: MenuItemDto[];
  filteredMenu: MenuItemDto[];
  loadingMenu: boolean;
  menuSearch: string;
  onMenuSearchChange: (value: string) => void;
  onOpenAddModal: () => void;
  onEditItem: (item: MenuItemDto) => void;
  onDeleteItem: (item: MenuItemDto) => void;
};

export function AdminRestaurantMenuItems({
  menu,
  filteredMenu,
  loadingMenu,
  menuSearch,
  onMenuSearchChange,
  onOpenAddModal,
  onEditItem,
  onDeleteItem,
}: AdminRestaurantMenuItemsProps) {
  return (
    <>
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
            onChange={(e) => onMenuSearchChange(e.target.value)}
            placeholder="Search menu dishes…"
            className="h-9 w-full rounded-xl border border-slate-200/90 bg-slate-50/50 pl-8.5 pr-7 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />
          {menuSearch ? (
            <button
              type="button"
              onClick={() => onMenuSearchChange("")}
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
            onClick={onOpenAddModal}
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
            onClick={() => onMenuSearchChange("")}
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
              const verifiedDate = formatVerifiedDate(item.lastVerifiedAt);

              return (
                <div
                  key={item.id ?? `${item.name}-${index}`}
                  className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs space-y-3 transition hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shadow-2xs">
                        <LuUtensils size={17} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">
                          {item.name}
                        </p>
                        {item.id ? (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            ID #{item.id}
                          </p>
                        ) : null}
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
                        onClick={() => onEditItem(item)}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition cursor-pointer min-h-[34px]"
                      >
                        <FiEdit2 size={12} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteItem(item)}
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
                  <th className="px-4 py-3.5 font-bold text-slate-700">
                    Verified Price
                  </th>
                  <th className="px-4 py-3.5">Last Verified</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMenu.map((item, index) => {
                  const verifiedDate = formatVerifiedDate(item.lastVerifiedAt);

                  return (
                    <tr
                      key={item.id ?? `${item.name}-${index}`}
                      className="group transition-colors hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-700">
                            <LuUtensils size={17} />
                          </span>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">
                              {item.name}
                            </p>
                            {item.id ? (
                              <p className="text-[10px] text-slate-400">
                                ID #{item.id}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-bold tabular-nums text-slate-900 text-sm">
                          {formatMoney(item.verifiedPrice)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {verifiedDate ? (
                          <span className="inline-flex items-center gap-1.5 text-slate-600">
                            <FiClock size={12} className="text-slate-400" />
                            <span>{verifiedDate}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-slate-400 italic">
                            <FiHelpCircle size={12} />
                            <span>Unverified</span>
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditItem(item)}
                            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition cursor-pointer"
                            title="Edit verified price"
                          >
                            <FiEdit2 size={12} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteItem(item)}
                            className="inline-flex items-center gap-1 rounded-xl bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition cursor-pointer"
                            title="Remove from menu"
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
    </>
  );
}

