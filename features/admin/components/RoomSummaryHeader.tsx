"use client";

import {
  FiClock,
  FiLock,
  FiPhone,
  FiPhoneCall,
  FiUsers,
} from "react-icons/fi";
import { LuUtensils } from "react-icons/lu";

import { Button, CountdownTimer, StatusChip } from "@/components/ui";
import type { RoomOrderSummary } from "@/features/orders/store/orderSlice";
import type { RoomResponse } from "@/features/rooms/store/roomSlice";
import { formatDateTime, formatMoney } from "@/lib/formatters";

type RoomSummaryHeaderProps = {
  room: RoomResponse;
  isOpen: boolean;
  summary: RoomOrderSummary | null;
  totalItemsCount: number;
  onExpire: () => void;
  onOpenCloseModal: () => void;
};

export function RoomSummaryHeader({
  room,
  isOpen,
  summary,
  totalItemsCount,
  onExpire,
  onOpenCloseModal,
}: RoomSummaryHeaderProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 shadow-xs">
            <LuUtensils size={24} className="text-emerald-800" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {room.restaurantName}
              </h1>
              <StatusChip status={room.status} />
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {room.description || "Office breakfast order"}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
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
              {isOpen ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <CountdownTimer
                    secondsRemaining={room.secondsRemaining}
                    expiresAt={room.expiresAt}
                    size="sm"
                    onExpire={onExpire}
                  />
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {room.restaurantPhone ? (
            <a
              href={`tel:${room.restaurantPhone}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-98"
            >
              <FiPhoneCall size={16} />
              <span>Call {room.restaurantPhone}</span>
            </a>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-xs font-semibold text-slate-500">
              <FiPhone size={14} />
              <span>No phone registered</span>
            </div>
          )}

          {isOpen ? (
            <Button
              variant="destructive"
              size="md"
              onClick={onOpenCloseModal}
              className="cursor-pointer"
            >
              <span className="inline-flex items-center gap-1.5 font-bold">
                <FiLock size={15} />
                Close Room
              </span>
            </Button>
          ) : null}
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:p-4 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
            Participants
          </p>
          <p className="mt-1 text-lg sm:text-2xl font-bold tabular-nums text-slate-900 truncate">
            {summary?.participantCount ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:p-4 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
            Total Items
          </p>
          <p className="mt-1 text-lg sm:text-2xl font-bold tabular-nums text-slate-900 truncate">
            {totalItemsCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:p-4 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
            Estimated Subtotal
          </p>
          <p className="mt-1 text-lg sm:text-2xl font-bold tabular-nums text-emerald-700 truncate">
            {formatMoney(summary?.foodTotal ?? 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:p-4 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
            Pricing Mode
          </p>
          <p className="mt-1 text-xs font-bold text-slate-800 line-clamp-2">
            {summary?.pricesVerified
              ? "Verified catalog prices"
              : "User estimated prices"}
          </p>
        </div>
      </div>
    </div>
  );
}
