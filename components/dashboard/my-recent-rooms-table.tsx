import Link from "next/link";
import { FiArrowRight, FiFileText } from "react-icons/fi";

import { StatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { RoomResponse } from "@/features/rooms/store/roomSlice";

type MyRecentRoomsTableProps = {
  rooms: RoomResponse[];
  loading?: boolean;
};

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function MyRecentRoomsTable({ rooms, loading }: MyRecentRoomsTableProps) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
          <p className="mt-0.5 text-xs text-slate-500">Rooms you have ordered from</p>
        </div>
        <Link
          href="/user/my-orders"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          <span>All orders</span>
          <FiArrowRight size={13} />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={<FiFileText size={26} />}
          title="No breakfast orders yet"
          description="When you join an open room and order breakfast, your order history and bill breakdown will show up here."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[440px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-3 py-2.5">Restaurant</th>
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70">
              {rooms.slice(0, 6).map((room) => {
                const isClosedOrApproved =
                  room.status === "CLOSED" ||
                  room.status === "PENDING_ADMIN_APPROVAL" ||
                  room.status === "APPROVED_AND_CLOSED";

                return (
                  <tr
                    key={room.id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-3 py-3">
                      <p className="font-semibold text-slate-900 line-clamp-1">
                        {room.restaurantName}
                      </p>
                      {room.description ? (
                        <p className="line-clamp-1 text-[11px] text-slate-400">
                          {room.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(room.createdAt ?? room.finalizedAt)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <StatusChip status={room.status} size="sm" />
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {isClosedOrApproved ? (
                          <Link
                            href={`/user/rooms/${room.id}/my-bill`}
                            className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                          >
                            My bill
                          </Link>
                        ) : null}
                        <Link
                          href={`/user/rooms/${room.id}`}
                          className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                        >
                          View room
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
