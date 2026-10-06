"use client";

import { FiUser, FiUsers } from "react-icons/fi";

import { PhoneLink } from "@/components/shared/phone-link";
import { CountdownTimer, EmptyState, StatusChip } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import type { RoomOrderSummary } from "@/features/orders/store/orderSlice";
import type { RoomResponse } from "@/features/rooms/store/roomSlice";

type RoomOrderingHeaderProps = {
  loading: boolean;
  room: RoomResponse | null;
  isOpen: boolean;
  orderSummary: RoomOrderSummary | null;
  onExpire: () => void;
};

export function RoomOrderingHeader({
  loading,
  room,
  isOpen,
  orderSummary,
  onExpire,
}: RoomOrderingHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-200/90 bg-linear-to-br from-white via-emerald-50/20 to-emerald-50/30 p-4 sm:p-7 shadow-xs">
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-9 w-72 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
      ) : room ? (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip status={isOpen ? "OPEN" : (room.status || "CLOSED")} />
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                Room #{room.id}
              </span>

              {room.createdByName ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/80 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  <FiUser size={12} className="text-slate-400" />
                  Opened by {room.createdByName}
                </span>
              ) : null}

              {typeof orderSummary?.participantCount === "number" &&
              orderSummary.participantCount > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200/70">
                  <FiUsers size={12} className="text-emerald-700" />
                  {orderSummary.participantCount}{" "}
                  {orderSummary.participantCount === 1
                    ? "Participant"
                    : "Participants"}
                </span>
              ) : null}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {room.restaurantName}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                {room.description ||
                  "Shared office breakfast order. Items will be delivered together and delivery fee is split equally."}
              </p>
            </div>

            {room.restaurantPhone ? (
              <div className="text-xs text-slate-600">
                Restaurant Contact: <PhoneLink phone={room.restaurantPhone} />
              </div>
            ) : null}
          </div>

          {/* Countdown Urgency Box */}
          <div className="flex w-full sm:w-auto shrink-0 flex-col items-center justify-center rounded-2xl border border-emerald-200/80 bg-white/90 px-4 sm:px-6 py-3.5 sm:py-4 text-center shadow-2xs backdrop-blur-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isOpen ? "Ordering Closes In" : "Order Status"}
            </p>
            {isOpen ? (
              <div className="mt-1.5">
                <CountdownTimer
                  secondsRemaining={room.secondsRemaining}
                  expiresAt={room.expiresAt}
                  size="lg"
                  showIcon
                  onExpire={onExpire}
                />
              </div>
            ) : (
              <p className="mt-1.5 text-base font-bold text-slate-700">
                Room Closed
              </p>
            )}
            {isOpen ? (
              <p className="mt-1 text-[11px] text-slate-400">
                Orders lock automatically when time reaches zero
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <EmptyState
          title="Room not found"
          description="This breakfast room could not be loaded or may have expired."
        />
      )}
    </div>
  );
}
