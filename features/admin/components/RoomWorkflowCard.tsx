"use client";

import Link from "next/link";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiLock,
  FiPhone,
} from "react-icons/fi";

import { Button } from "@/components/ui";
import type { RoomResponse } from "@/features/rooms/store/roomSlice";

type RoomWorkflowCardProps = {
  room: RoomResponse;
  onOpenCloseModal: () => void;
};

export function RoomWorkflowCard({
  room,
  onOpenCloseModal,
}: RoomWorkflowCardProps) {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Next Action
        </p>
        <h3 className="mt-1 text-base font-bold text-slate-900">
          Room Lifecycle Pipeline
        </h3>

        <div className="mt-4 space-y-3">
          {room.status === "OPEN" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-950 space-y-3">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <FiClock size={14} className="text-amber-600" />
                  <span>Room is currently OPEN</span>
                </div>
                <p className="mt-1.5 text-amber-800 leading-relaxed">
                  Team members are submitting breakfast choices. You can manually close this room at any time to lock orders and proceed to paper receipt entry.
                </p>
              </div>

              <Button
                fullWidth
                variant="destructive"
                size="sm"
                onClick={onOpenCloseModal}
                className="shadow-sm cursor-pointer"
              >
                <span className="inline-flex items-center gap-1.5 font-bold">
                  <FiLock size={14} />
                  Close Room
                </span>
              </Button>
            </div>
          ) : null}

          {room.status === "CLOSED" ? (
            <div>
              <div className="mb-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
                <p className="font-bold text-emerald-900">Ready for Receipt Entry</p>
                <p className="mt-1 text-emerald-700">
                  Orders are locked. Enter the actual receipt prices and delivery fee to generate bills.
                </p>
              </div>
              <Link href={`/admin/rooms/${room.id}/receipt`} className="block">
                <Button fullWidth variant="primary">
                  <span className="inline-flex items-center gap-2">
                    <FiDollarSign size={15} />
                    Enter Paper Receipt
                  </span>
                </Button>
              </Link>
            </div>
          ) : null}

          {room.status === "PENDING_ADMIN_APPROVAL" ? (
            <div>
              <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-900">
                <p className="font-bold">Receipt Saved</p>
                <p className="mt-1 text-emerald-700">
                  Review the final bill splits and give final approval to close the room.
                </p>
              </div>
              <Link href={`/admin/rooms/${room.id}/approval`} className="block">
                <Button fullWidth variant="primary">
                  <span className="inline-flex items-center gap-2">
                    <FiCheckCircle size={15} />
                    Review & Approve Room
                  </span>
                </Button>
              </Link>
            </div>
          ) : null}

          {room.status === "APPROVED_AND_CLOSED" ? (
            <div>
              <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-900">
                <p className="font-bold">Room Approved & Closed</p>
                <p className="mt-1 text-emerald-700">
                  Financial reconciliation complete. All participants have their finalized bill share.
                </p>
              </div>
              <Link href={`/user/rooms/${room.id}/bill`} className="block">
                <Button fullWidth variant="secondary">
                  <span className="inline-flex items-center gap-2">
                    <FiFileText size={15} />
                    View Participant Split Bill
                  </span>
                </Button>
              </Link>
            </div>
          ) : null}

          <div className="pt-2">
            <Link href="/admin/admin-dashboard" className="block">
              <Button fullWidth variant="ghost" size="sm">
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <FiArrowLeft size={13} />
                  Back to Admin Dashboard
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Restaurant Contact Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-slate-50/70 p-5 shadow-xs">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Vendor Info
        </p>
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          <p className="font-bold text-slate-900">{room.restaurantName}</p>
          {room.restaurantPhone ? (
            <p className="inline-flex items-center gap-2 text-xs">
              <FiPhone size={13} className="text-slate-400" />
              <a
                href={`tel:${room.restaurantPhone}`}
                className="font-semibold text-emerald-700 hover:underline"
              >
                {room.restaurantPhone}
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

