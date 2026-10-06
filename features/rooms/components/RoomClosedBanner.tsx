"use client";

import Link from "next/link";
import {
  FiCheckCircle,
  FiDollarSign,
  FiFileText,
  FiLock,
} from "react-icons/fi";

import { Button, StatusChip } from "@/components/ui";
import type { RoomResponse } from "@/features/rooms/store/roomSlice";

type RoomClosedBannerProps = {
  room: RoomResponse;
  isAdmin: boolean;
};

export function RoomClosedBanner({ room, isAdmin }: RoomClosedBannerProps) {
  return (
    <div className="flex flex-col gap-3.5 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
          <FiLock size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-900">
              Room Ordering is Closed (Read-Only)
            </p>
            <StatusChip status={room.status} size="sm" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {room.status === "CLOSED"
              ? "Orders are locked. No additional dishes can be added or modified."
              : room.status === "PENDING_ADMIN_APPROVAL"
                ? "Paper receipt has been recorded. Room is awaiting admin approval."
                : "Final bills are calculated and closed."}
          </p>
        </div>
      </div>

      {isAdmin ? (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link href={`/admin/rooms/${room.id}/summary`}>
            <Button size="sm" variant="secondary">
              <span className="inline-flex items-center gap-1.5">
                <FiFileText size={14} />
                Calling Sheet
              </span>
            </Button>
          </Link>
          {room.status === "CLOSED" ? (
            <Link href={`/admin/rooms/${room.id}/receipt`}>
              <Button size="sm" variant="primary">
                <span className="inline-flex items-center gap-1.5">
                  <FiDollarSign size={14} />
                  Enter Paper Receipt
                </span>
              </Button>
            </Link>
          ) : room.status === "PENDING_ADMIN_APPROVAL" ? (
            <Link href={`/admin/rooms/${room.id}/approval`}>
              <Button size="sm" variant="primary">
                <span className="inline-flex items-center gap-1.5">
                  <FiCheckCircle size={14} />
                  Sign-Off Approval
                </span>
              </Button>
            </Link>
          ) : room.status === "APPROVED_AND_CLOSED" ? (
            <Link href={`/user/rooms/${room.id}/bill`}>
              <Button size="sm" variant="secondary">
                <span className="inline-flex items-center gap-1.5">
                  <FiFileText size={14} />
                  Final Split Bill
                </span>
              </Button>
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
