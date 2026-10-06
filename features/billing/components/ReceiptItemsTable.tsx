"use client";

import { FiAlertTriangle, FiShoppingBag } from "react-icons/fi";
import { LuReceipt, LuUtensils } from "react-icons/lu";

import type { ReceiptEntryItem } from "@/features/billing/hooks/useReceiptEntry";
import type { MenuItemDto } from "@/features/restaurants/store/restaurantSlice";
import { priceKey } from "@/features/billing/utils/priceKey";
import { formatMoney } from "@/lib/formatters";

type ReceiptItemsTableProps = {
  items: ReceiptEntryItem[];
  menu: MenuItemDto[] | null;
  isOpen: boolean;
  isFinalized: boolean;
  priceFor: (itemName: string) => number;
  handlePriceChange: (name: string, value: string) => void;
};

export function ReceiptItemsTable({
  items,
  menu,
  isOpen,
  isFinalized,
  priceFor,
  handlePriceChange,
}: ReceiptItemsTableProps) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Receipt items
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter the price shown on the paper receipt for each ordered item.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 self-start sm:self-auto">
          <LuReceipt size={13} />
          <span>{items.length} distinct {items.length === 1 ? "dish" : "dishes"}</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <FiShoppingBag size={22} />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            No orders placed in this room
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {isOpen
              ? "This room is currently OPEN. Room participants must add items and submit orders before a paper receipt can be entered and split."
              : "This room was closed with 0 participant orders. The server requires at least one order to calculate and split a bill."}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {items.map((item, index) => {
            const key = priceKey(item.itemName);
            const quantity = Number(item.totalQuantity ?? 0);
            const unitPrice = priceFor(item.itemName);
            const lineTotal = quantity * unitPrice;
            const isMissingPrice = unitPrice <= 0;

            return (
              <div
                key={key}
                className={`rounded-2xl border p-4 shadow-2xs transition ${
                  isMissingPrice
                    ? "border-amber-200 bg-amber-50/30"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: Item Information */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">
                        {item.itemName}
                      </h4>
                      <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                        Qty {quantity}
                      </span>
                      {isMissingPrice ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          <FiAlertTriangle size={11} />
                          Needs price
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>
                        Ordered total:{" "}
                        <strong className="text-slate-700">
                          {formatMoney(item.totalPrice)}
                        </strong>
                      </span>
                      {Number(item.verifiedUnitPrice ?? 0) > 0 ? (
                        <span>
                          · Menu verified:{" "}
                          <strong className="text-slate-700">
                            {formatMoney(item.verifiedUnitPrice)}
                          </strong>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Right: Receipt Price Input & Line Total */}
                  <div className="flex items-center gap-3 sm:gap-4 self-stretch sm:self-auto justify-between sm:justify-end w-full sm:w-auto pt-2 sm:pt-0 border-t border-slate-100 sm:border-0">
                    <div className="w-32 sm:w-36 flex-1 sm:flex-none">
                      <label
                        htmlFor={`price-input-${index}`}
                        className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400"
                      >
                        Receipt price
                      </label>
                      <div
                        className={`relative flex items-center rounded-xl border px-3 py-1.5 transition ${
                          isMissingPrice
                            ? "border-amber-300 bg-white ring-2 ring-amber-100"
                            : "border-slate-200 bg-slate-50 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100"
                        }`}
                      >
                        <span className="mr-1 text-xs font-bold text-slate-400">
                          EGP
                        </span>
                        <input
                          id={`price-input-${index}`}
                          type="number"
                          min="0"
                          max="100000"
                          step="0.01"
                          disabled={isFinalized}
                          value={unitPrice || ""}
                          placeholder="0.00"
                          onChange={(e) =>
                            handlePriceChange(
                              item.itemName,
                              e.target.value,
                            )
                          }
                          aria-label={`Receipt price for ${item.itemName}`}
                          className="w-full bg-transparent text-right text-sm font-bold tabular-nums text-slate-900 outline-none disabled:cursor-not-allowed disabled:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="min-w-[80px] sm:min-w-[90px] text-right">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Line total
                      </span>
                      <span className="text-sm font-bold tabular-nums text-slate-900">
                        {formatMoney(lineTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Optional Reference: Restaurant Menu Catalog */}
      {menu && menu.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60">
            <div className="flex items-center gap-2">
              <LuUtensils className="text-slate-500" size={14} />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Restaurant Menu Catalog ({menu.length} {menu.length === 1 ? "dish" : "dishes"})
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Reference only</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            These dishes are registered in this restaurant’s menu catalog. Only items actually ordered by room members appear in the receipt above.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {menu.map((dish) => (
              <div
                key={dish.id ?? dish.name}
                className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white px-3 py-2 text-xs shadow-2xs"
              >
                <span className="font-semibold text-slate-800 truncate">{dish.name}</span>
                <span className="font-bold tabular-nums text-slate-600 shrink-0">
                  {formatMoney(dish.verifiedPrice ?? dish.price ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

