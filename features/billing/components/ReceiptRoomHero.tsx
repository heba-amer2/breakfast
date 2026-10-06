"use client";

import { FiAlertTriangle, FiClock, FiFileText, FiShoppingBag, FiUsers } from "react-icons/fi";
import { LuUtensils } from "react-icons/lu";

import { StatusChip } from "@/components/ui";
import type { RoomResponse } from "@/features/rooms/store/roomSlice";
import type { ReceiptEntryItem } from "@/features/billing/hooks/useReceiptEntry";
import type { RoomOrderSummary } from "@/features/orders/store/orderSlice";
import { formatDateTime, formatMoney } from "@/lib/formatters";

type ReceiptRoomHeroProps = {
  room: RoomResponse;
  items: ReceiptEntryItem[];
  participantCount: number;
  summary: RoomOrderSummary | null;
  foodSubtotal: number;
  unpricedItems: ReceiptEntryItem[];
};

export function ReceiptRoomHero({
  room,
  items,
  participantCount,
  summary,
  foodSubtotal,
  unpricedItems,
}: ReceiptRoomHeroProps) {
  return (
    <>
      {/* Room Information Card */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                <LuUtensils size={13} />
                Room #{room.id}
              </span>
              <span className="text-xs text-slate-400 font-medium">·</span>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Financial Entry
              </p>
            </div>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              {room.restaurantName}
            </h2>

            {room.description ? (
              <p className="mt-1 text-sm text-slate-600 max-w-2xl">
                {room.description}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <FiClock size={13} className="text-slate-400" />
                Opened {formatDateTime(room.createdAt)}
              </span>
              {room.createdByName ? (
                <span className="inline-flex items-center gap-1.5">
                  <FiUsers size={13} className="text-slate-400" />
                  Opened by {room.createdByName}
                </span>
              ) : null}
              {room.restaurantPhone ? (
                <span className="inline-flex items-center gap-1.5">
                  <FiFileText size={13} className="text-slate-400" />
                  {room.restaurantPhone}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <StatusChip status={room.status} className="text-sm" />
            <span className="text-[11px] text-slate-400 font-medium">
              {items.length} unique ordered {items.length === 1 ? "item" : "items"}
            </span>
          </div>
        </div>

        {/* Room Quick Metrics */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Participants
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
              {participantCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Distinct Items
            </p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xl font-bold tabular-nums text-slate-900">
              <FiShoppingBag size={16} className="text-slate-400" />
              {items.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Food as Ordered
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
              {formatMoney(
                typeof summary?.foodTotal === "number"
                  ? summary.foodTotal
                  : foodSubtotal,
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Menu Defaults
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-800">
              {summary?.pricesVerified
                ? "Verified menu prices loaded"
                : "Receipt input required"}
            </p>
          </div>
        </div>
      </div>

      {/* Unpriced Items Warning Block */}
      {unpricedItems.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-amber-900">
                Items still missing a receipt price ({unpricedItems.length})
              </h4>
              <p className="text-xs text-amber-800">
                Please enter the unit price for each item below before saving. The server requires all ordered items to have a verified price.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {unpricedItems.map((item) => (
                  <span
                    key={item.itemName}
                    className="inline-flex items-center rounded-lg border border-amber-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-amber-900 shadow-2xs"
                  >
                    {item.itemName}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

