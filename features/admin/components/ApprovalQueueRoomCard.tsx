import Link from "next/link";
import {
  FiArrowRight,
  FiClock,
  FiCoffee,
  FiTruck,
  FiUser,
} from "react-icons/fi";

import { Button, StatusChip } from "@/components/ui";
import { roomMoment } from "@/features/admin/utils/approvalQueueSearch";
import type { RoomResponse } from "@/features/rooms/store/roomSlice";
import { formatDateTime, formatMoney } from "@/lib/formatters";

type QueueTab = "receipt" | "approval";

export function ApprovalQueueRoomCard({
  room,
  index,
  activeTab,
}: {
  room: RoomResponse;
  index: number;
  activeTab: QueueTab;
}) {
  const isPendingApproval = activeTab === "approval" || room.status === "PENDING_ADMIN_APPROVAL";
  const actionHref = isPendingApproval
    ? `/admin/rooms/${room.id}/approval`
    : `/admin/rooms/${room.id}/receipt`;

  const actionLabel = isPendingApproval
    ? "Review & approve"
    : "Enter receipt";

  return (
    <li className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3.5 sm:gap-4">
          <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xs sm:text-sm font-bold tabular-nums text-slate-600">
            {index + 1}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-slate-900">
                {room.restaurantName}
              </h3>
              <StatusChip status={room.status} />
              <span className="text-xs font-semibold text-slate-400">
                #{room.id}
              </span>
            </div>

            <p className="mt-1 line-clamp-1 text-sm text-slate-500">
              {room.description || "Closed room awaiting administrative processing."}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <FiUser size={13} className="text-slate-400" />
                Host: {room.createdByName ?? "Admin"}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <FiClock size={13} className="text-slate-400" />
                {isPendingApproval ? "Receipt saved" : "Closed"}{" "}
                {formatDateTime(roomMoment(room))}
              </span>

              {typeof room.menuItemCount === "number" && room.menuItemCount > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <FiCoffee size={13} className="text-slate-400" />
                  {room.menuItemCount} menu {room.menuItemCount === 1 ? "item" : "items"}
                </span>
              ) : null}

              {typeof room.totalDeliveryFee === "number" && room.totalDeliveryFee > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <FiTruck size={13} className="text-slate-400" />
                  {formatMoney(room.totalDeliveryFee)} delivery
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row sm:items-center lg:justify-end w-full lg:w-auto">
          <div className="flex items-center justify-between sm:block rounded-2xl bg-slate-50 px-4 py-2 sm:py-2.5 text-left sm:text-right w-full sm:w-auto border border-slate-100">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {isPendingApproval ? "Receipt total" : "Items ordered"}
            </p>
            <p className="mt-0.5 text-base sm:text-lg font-bold tabular-nums text-slate-900">
              {isPendingApproval
                ? formatMoney(room.receiptTotal)
                : (room.menuItemCount ?? "—")}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link href={`/admin/rooms/${room.id}/summary`} className="flex-1 sm:flex-none">
              <Button fullWidth size="sm" variant="ghost" className="sm:w-auto min-h-[38px] sm:min-h-[36px]">
                Summary
              </Button>
            </Link>

            <Link href={actionHref} className="flex-1 sm:flex-none">
              <Button fullWidth size="sm" className="sm:w-auto min-h-[38px] sm:min-h-[36px]">
                <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                  {actionLabel}
                  <FiArrowRight size={14} />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}
