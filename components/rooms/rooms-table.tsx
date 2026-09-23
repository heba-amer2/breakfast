"use client";

import Link from "next/link";
import { FiArrowRight, FiCoffee, FiUser } from "react-icons/fi";

import { CountdownTimer } from "@/components/ui/countdown-timer";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip } from "@/components/ui/status-chip";
import type { RoomResponse } from "@/features/rooms/store/roomSlice";

type RoomsTableProps = {
  rooms: RoomResponse[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RoomsTable({
  rooms,
  loading,
  emptyTitle = "No breakfast rooms open right now",
  emptyDescription = "When an admin opens a room, it will appear here.",
}: RoomsTableProps) {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="p-6">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <th className="px-5 py-3">Restaurant</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Countdown</th>
            <th className="px-4 py-3">Creator</th>
            <th className="px-4 py-3">Menu</th>
            <th className="px-4 py-3">Opened At</th>
            <th className="px-5 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rooms.map((room) => {
            const isOpen = room.status === "OPEN";

            return (
              <tr
                key={room.id}
                className="group transition-colors hover:bg-slate-50/80"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                        isOpen
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <FiCoffee size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {room.restaurantName}
                      </p>
                      <p className="line-clamp-1 max-w-xs text-xs text-slate-400">
                        {room.description || "Smart office breakfast order"}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3.5 whitespace-nowrap">
                  <StatusChip status={room.status} size="sm" />
                </td>

                <td className="px-4 py-3.5 whitespace-nowrap">
                  {isOpen ? (
                    <CountdownTimer
                      secondsRemaining={room.secondsRemaining}
                      expiresAt={room.expiresAt}
                      showIcon
                      pill
                    />
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">—</span>
                  )}
                </td>

                <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <FiUser size={13} className="text-slate-400" />
                    {room.createdByName || "Admin"}
                  </span>
                </td>

                <td className="px-4 py-3.5 whitespace-nowrap tabular-nums text-xs text-slate-600">
                  {typeof room.menuItemCount === "number"
                    ? `${room.menuItemCount} items`
                    : "—"}
                </td>

                <td className="px-4 py-3.5 whitespace-nowrap tabular-nums text-xs text-slate-500">
                  {formatDate(room.createdAt)}
                </td>

                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <Link
                    href={`/user/rooms/${room.id}`}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      isOpen
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>{isOpen ? "Join & Order" : "View"}</span>
                    <FiArrowRight size={13} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
