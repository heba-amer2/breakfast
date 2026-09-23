import Link from "next/link";
import { FiArrowRight, FiCoffee, FiUser } from "react-icons/fi";

import { CountdownTimer } from "@/components/ui/countdown-timer";
import { StatusChip } from "@/components/ui/status-chip";
import type { RoomResponse } from "@/features/rooms/store/roomSlice";

type RoomCardProps = {
  room: RoomResponse;
};

export function RoomCard({ room }: RoomCardProps) {
  const isOpen = room.status === "OPEN";

  return (
    <Link
      href={`/user/rooms/${room.id}`}
      className={`group relative block rounded-2xl border p-5 shadow-xs transition-all duration-200 food-card-hover ${
        isOpen
          ? "border-emerald-200/80 bg-linear-to-b from-white to-emerald-50/20 hover:border-emerald-300"
          : "border-slate-200/90 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-2xs ${
              isOpen
                ? "bg-emerald-100/80 text-emerald-700 ring-1 ring-emerald-200/70"
                : "bg-slate-100 text-slate-500 ring-1 ring-slate-200/60"
            }`}
          >
            <FiCoffee size={20} />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              {room.restaurantName}
            </h3>
            {room.description ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                {room.description}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-slate-400">Team breakfast order</p>
            )}
          </div>
        </div>

        <StatusChip status={room.status} size="sm" />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100/90 pt-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-3">
          {isOpen ? (
            <CountdownTimer
              secondsRemaining={room.secondsRemaining}
              expiresAt={room.expiresAt}
              showIcon
              pill
            />
          ) : (
            <span className="text-slate-400 font-medium">Ordering closed</span>
          )}

          {room.createdByName ? (
            <span className="inline-flex items-center gap-1 text-slate-500">
              <FiUser size={13} className="text-slate-400" />
              {room.createdByName}
            </span>
          ) : null}

          {typeof room.menuItemCount === "number" ? (
            <span className="text-slate-500 font-medium">
              {room.menuItemCount} {room.menuItemCount === 1 ? "item" : "items"}
            </span>
          ) : null}
        </div>

        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 transition-transform group-hover:translate-x-1">
          <span>{isOpen ? "Order now" : "View room"}</span>
          <FiArrowRight size={13} />
        </span>
      </div>
    </Link>
  );
}
