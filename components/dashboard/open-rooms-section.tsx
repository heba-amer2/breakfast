import Link from "next/link";
import { FiArrowRight, FiCoffee } from "react-icons/fi";

import { RoomCard } from "@/components/rooms/room-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { RoomResponse } from "@/features/rooms/store/roomSlice";

type OpenRoomsSectionProps = {
  rooms: RoomResponse[];
  loading?: boolean;
};

export function OpenRoomsSection({ rooms, loading }: OpenRoomsSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Live Breakfast Rooms
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Accepting orders right now · Auto-closes when timer hits zero
          </p>
        </div>
        <Link
          href="/user/rooms"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          <span>View all</span>
          <FiArrowRight size={13} />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={<FiCoffee size={28} />}
          title="No breakfast rooms open right now"
          description="When an admin opens a room for breakfast, it will appear here so you can add your order."
        />
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </section>
  );
}
