"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiClock,
  FiShield,
  FiUsers,
} from "react-icons/fi";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button, EmptyState, StatusChip } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import { fetchRoomBill } from "@/features/billing/store/billingThunks";
import { fetchRoomById } from "@/features/rooms/store/roomThunks";
import { formatMoney } from "@/lib/formatters";

export default function FullRoomBillPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = Number(params.roomId);
  const dispatch = useAppDispatch();

  const room = useAppSelector((state) => state.rooms.currentRoom);
  const bill = useAppSelector((state) => state.billing.bill);
  const billingError = useAppSelector((state) => state.billing.error);
  const roomError = useAppSelector((state) => state.rooms.error);

  const [loading, setLoading] = useState(true);

  useAuthFetch(async () => {
    if (!Number.isFinite(roomId)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    await Promise.all([
      dispatch(fetchRoomById(roomId)),
      dispatch(fetchRoomBill(roomId)),
    ]);
    setLoading(false);
  }, [roomId]);

  const breakdown = bill?.breakdown ?? [];
  const isVerified = Boolean(bill?.pricesVerified);

  return (
    <>
      <TopBar
        title={bill?.restaurantName ? `Team Split · ${bill.restaurantName}` : "Team Split Bill"}
        subtitle="Complete transparent audit of every team member's order and delivery split."
        tag="Full Room Split"
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/user/rooms/${roomId}/my-bill`}>
              <Button variant="secondary" size="sm">
                <span className="inline-flex items-center gap-1.5">
                  <FiArrowLeft size={14} />
                  My Personal Bill
                </span>
              </Button>
            </Link>
            <Link href={`/user/rooms/${roomId}`}>
              <Button variant="ghost" size="sm">
                Room Menu
              </Button>
            </Link>
          </div>
        }
      />

      <PageContainer className="space-y-6 pb-12">
        {roomError || billingError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {roomError || billingError}
          </div>
        ) : null}

        {/* Room Header Info */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <StatusChip status={room?.status} />
              <span className="text-xs text-slate-400 font-semibold">
                Room #{roomId}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {bill?.restaurantName || room?.restaurantName || "Breakfast Room"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {room?.description || "Shared office breakfast order"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                <FiShield size={14} className="text-emerald-600" />
                Verified from Receipt
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">
                <FiClock size={14} className="text-slate-500" />
                Estimated Split
              </span>
            )}
          </div>
        </div>

        {/* Financial Highlights Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Food Cost
            </p>
            <p className="mt-1.5 text-2xl font-extrabold text-slate-900 tabular-nums">
              {loading ? "—" : formatMoney(bill?.totalFoodCost ?? 0)}
            </p>
            <p className="mt-1 text-xs text-slate-500">Sum of all participant dishes</p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Delivery Fee
            </p>
            <p className="mt-1.5 text-2xl font-extrabold text-slate-900 tabular-nums">
              {loading ? "—" : formatMoney(bill?.totalDelivery ?? 0)}
            </p>
            <p className="mt-1 text-xs text-slate-500">From restaurant receipt</p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Per Person Delivery
            </p>
            <p className="mt-1.5 text-2xl font-extrabold text-slate-900 tabular-nums">
              {loading ? "—" : formatMoney(bill?.deliverySharePerPerson ?? 0)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Split among {bill?.participantCount ?? 0} participants
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200/80 bg-linear-to-br from-white to-emerald-50/50 p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Room Grand Total
            </p>
            <p className="mt-1.5 text-2xl font-extrabold text-emerald-900 tabular-nums">
              {loading ? "—" : formatMoney(bill?.grandTotal ?? 0)}
            </p>
            <p className="mt-1 text-xs text-emerald-700/80">Food + Delivery total</p>
          </div>
        </div>

        {/* Participant Breakdown Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="border-b border-slate-100 bg-slate-50/50 p-4 sm:flex sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Participant Split Breakdown
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Each participant pays their individual food subtotal plus an equal share of delivery.
              </p>
            </div>
            <span className="mt-2 inline-flex sm:mt-0 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {breakdown.length} {breakdown.length === 1 ? "participant" : "participants"}
            </span>
          </div>

          {loading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : breakdown.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<FiUsers size={28} />}
                title="No bill data yet"
                description="Once members place orders in this room and the bill is generated, the breakdown will appear here."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/30">
                    <th className="px-5 py-3">Team Member</th>
                    <th className="px-4 py-3">Food Cost</th>
                    <th className="px-4 py-3">Delivery Share</th>
                    <th className="px-5 py-3 text-right font-bold">Total Amount Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {breakdown.map((item) => (
                    <tr key={item.userId} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                            {item.userName
                              ? item.userName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)
                              : "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {item.userName || `User #${item.userId}`}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              ID: #{item.userId}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 tabular-nums text-slate-700 font-medium">
                        {formatMoney(item.foodSubtotal)}
                      </td>

                      <td className="px-4 py-3.5 tabular-nums text-slate-600">
                        {formatMoney(item.deliveryShare)}
                      </td>

                      <td className="px-5 py-3.5 text-right tabular-nums font-extrabold text-slate-900 text-base">
                        {formatMoney(item.finalTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
}