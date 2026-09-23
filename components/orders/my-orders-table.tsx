"use client";

import Link from "next/link";
import { FiArrowRight, FiCoffee, FiFileText } from "react-icons/fi";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip } from "@/components/ui/status-chip";
import { formatDateTime, formatMoney } from "@/lib/formatters";
import type { RoomResponse } from "@/features/rooms/store/roomSlice";

type MyOrdersTableProps = {
  rooms: RoomResponse[];
  loading?: boolean;
};

export function MyOrdersTable({ rooms, loading }: MyOrdersTableProps) {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<FiCoffee size={28} />}
          title="No orders yet"
          description="Once you join a breakfast room and add items, your orders and billing history will appear here."
          action={
            <Link
              href="/user/rooms"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700"
            >
              <span>Browse Open Rooms</span>
              <FiArrowRight size={13} />
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <th className="px-5 py-3">Restaurant</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Receipt Total</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rooms.map((room) => {
            const canViewBill =
              room.status === "PENDING_ADMIN_APPROVAL" ||
              room.status === "APPROVED_AND_CLOSED" ||
              room.status === "CLOSED";

            return (
              <tr
                key={room.id}
                className="group transition-colors hover:bg-slate-50/80"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100 shadow-2xs">
                      <FiCoffee size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {room.restaurantName}
                      </p>
                      <p className="line-clamp-1 max-w-xs text-xs text-slate-400">
                        {room.description || "Office breakfast order"}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3.5 whitespace-nowrap tabular-nums text-xs text-slate-600">
                  {formatDateTime(room.createdAt ?? room.finalizedAt)}
                </td>

                <td className="px-4 py-3.5 whitespace-nowrap">
                  <StatusChip status={room.status} size="sm" />
                </td>

                <td className="px-4 py-3.5 whitespace-nowrap font-semibold tabular-nums text-slate-800">
                  {typeof room.receiptTotal === "number"
                    ? formatMoney(room.receiptTotal)
                    : "Pending Receipt"}
                </td>

                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5">
                    {canViewBill ? (
                      <Link
                        href={`/user/rooms/${room.id}/my-bill`}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                      >
                        <FiFileText size={12} />
                        <span>My Bill</span>
                      </Link>
                    ) : null}

                    <Link
                      href={`/user/rooms/${room.id}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <span>{room.status === "OPEN" ? "Order" : "View"}</span>
                      <FiArrowRight size={13} />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
