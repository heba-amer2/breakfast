"use client";

import { formatMoney } from "@/lib/formatters";

export type AggregatedOrderItem = {
  itemName: string;
  totalQuantity?: number;
  totalPrice?: number;
  verifiedUnitPrice?: number;
};

type RoomOrderSheetProps = {
  aggregatedItems: AggregatedOrderItem[];
};

export function RoomOrderSheet({ aggregatedItems }: RoomOrderSheetProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Restaurant Order Sheet
          </h2>
          <p className="text-xs text-slate-500">
            Read this directly over the phone to the restaurant.
          </p>
        </div>
        <span className="self-start sm:self-auto rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
          {aggregatedItems.length} unique dish{aggregatedItems.length === 1 ? "" : "es"}
        </span>
      </div>

      {aggregatedItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-sm text-slate-500">
          No items have been ordered in this room yet.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {aggregatedItems.map((item, index) => (
            <div
              key={`${item.itemName}-${index}`}
              className="flex items-center justify-between py-3.5 transition hover:bg-slate-50/60 px-2 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-xs">
                  {item.totalQuantity}×
                </span>
                <div>
                  <p className="font-semibold text-slate-900">
                    {item.itemName}
                  </p>
                  {typeof item.verifiedUnitPrice === "number" && item.verifiedUnitPrice > 0 ? (
                    <p className="text-xs text-slate-500">
                      ~{formatMoney(item.verifiedUnitPrice)} each
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="text-right">
                <span className="font-semibold tabular-nums text-slate-800">
                  {formatMoney(
                    item.totalPrice ??
                      Number(item.totalQuantity ?? 0) *
                        Number(item.verifiedUnitPrice ?? 0),
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
