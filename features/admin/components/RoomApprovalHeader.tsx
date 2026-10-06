import React from "react";
import { FiClock, FiFileText, FiUsers } from "react-icons/fi";
import { LuUtensils } from "react-icons/lu";
import { StatusChip } from "@/components/ui";
import { formatDateTime, formatMoney } from "@/lib/formatters";
import type { RoomResponse } from "@/features/rooms/store/roomSlice";

interface RoomApprovalHeaderProps {
  room: RoomResponse;
  itemsCount: number;
  participantCount: number;
  foodSubtotal: number;
  deliveryFee: number;
  receiptTotal: number;
}

export function RoomApprovalHeader({
  room,
  itemsCount,
  participantCount,
  foodSubtotal,
  deliveryFee,
  receiptTotal,
}: RoomApprovalHeaderProps) {
  return (
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
              Final Approval
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
                Host: {room.createdByName}
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
          <span className="text-xs text-slate-500 font-medium">
            {itemsCount} items to approve
          </span>
        </div>
      </div>

      {/* 4 Financial KPI Metrics */}
      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 sm:p-3.5 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
            Participants
          </p>
          <p className="mt-1 text-lg sm:text-xl font-bold tabular-nums text-slate-900 truncate">
            {participantCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 sm:p-3.5 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
            Food Subtotal
          </p>
          <p className="mt-1 text-lg sm:text-xl font-bold tabular-nums text-slate-900 truncate">
            {formatMoney(foodSubtotal)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 sm:p-3.5 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
            Delivery Fee
          </p>
          <p className="mt-1 text-lg sm:text-xl font-bold tabular-nums text-slate-900 truncate">
            {formatMoney(deliveryFee)}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3 sm:p-3.5 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 truncate">
            Final Grand Total
          </p>
          <p className="mt-1 text-lg sm:text-xl font-extrabold tabular-nums text-emerald-950 truncate">
            {formatMoney(receiptTotal)}
          </p>
        </div>
      </div>
    </div>
  );
}

