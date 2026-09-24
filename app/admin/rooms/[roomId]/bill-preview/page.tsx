"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiTruck,
  FiUsers,
} from "react-icons/fi";
import { LuReceipt, LuUtensils } from "react-icons/lu";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button, EmptyState, StatusChip } from "@/components/ui";
import { fetchBillPreview } from "@/features/billing/store/billingThunks";
import { fetchRoomById } from "@/features/rooms/store/roomThunks";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import { formatDateTime, formatMoney } from "@/lib/formatters";

export default function AdminBillPreviewPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = Number(params.roomId);
  const dispatch = useAppDispatch();

  const room = useAppSelector((state) => state.rooms.currentRoom);
  const bill = useAppSelector((state) => state.billing.bill);
  const loadingBill = useAppSelector((state) => state.billing.loading);
  const roomError = useAppSelector((state) => state.rooms.error);
  const billingError = useAppSelector((state) => state.billing.error);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { register, control, setValue } = useForm<{
    deliveryFee: number;
  }>({
    defaultValues: {
      deliveryFee: 0,
    },
  });

  const watchedDeliveryFee = useWatch({ control, name: "deliveryFee" });

  useAuthFetch(async () => {
    if (!Number.isFinite(roomId)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const roomResult = await dispatch(fetchRoomById(roomId));
    if (fetchRoomById.fulfilled.match(roomResult)) {
      const initialDelivery = Number(roomResult.payload.totalDeliveryFee ?? 0);
      setValue("deliveryFee", initialDelivery);
      await dispatch(fetchBillPreview({ roomId, totalDelivery: initialDelivery }));
    }
    setLoading(false);
  }, [roomId, setValue]);

  const handleRefreshPreview = async () => {
    if (!Number.isFinite(roomId)) return;
    setRefreshing(true);
    await dispatch(
      fetchBillPreview({
        roomId,
        totalDelivery: Number(watchedDeliveryFee ?? 0),
      }),
    );
    setRefreshing(false);
  };

  const breakdown = useMemo(() => bill?.breakdown ?? [], [bill]);

  return (
    <>
      <TopBar
        title="Bill Preview"
        subtitle="Real-time participant cost allocation and delivery distribution."
        tag="ADMIN OPS"
        actions={
          <Link
            href={`/admin/rooms/${Number.isFinite(roomId) ? roomId : ""}/summary`}
          >
            <Button size="sm" variant="secondary">
              <span className="inline-flex items-center gap-1.5">
                <FiArrowLeft size={14} />
                Back to summary
              </span>
            </Button>
          </Link>
        }
      />

      <PageContainer className="pb-12">
        {roomError || billingError ? (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-2xs">
            <FiAlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{roomError || billingError}</span>
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-4">
            <div className="h-44 animate-pulse rounded-[30px] bg-slate-100" />
            <div className="h-80 animate-pulse rounded-[30px] bg-slate-100" />
          </div>
        ) : !room ? (
          <EmptyState
            title="Room not found"
            description="The requested room could not be loaded."
            action={
              <Link href="/admin/approval-queue">
                <Button size="sm">Go to Approvals Pipeline</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Room Header Card */}
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      <LuUtensils size={13} />
                      Room #{room.id}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">·</span>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Bill Preview
                    </p>
                  </div>

                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    {room.restaurantName}
                  </h2>

                  {room.description ? (
                    <p className="mt-1 text-sm text-slate-600 max-w-2xl">
                      {room.description}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <FiClock size={13} className="text-slate-400" />
                      Created {formatDateTime(room.createdAt)}
                    </span>
                    {room.createdByName ? (
                      <span className="inline-flex items-center gap-1.5">
                        <FiUsers size={13} className="text-slate-400" />
                        Host: {room.createdByName}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusChip status={room.status} className="text-sm" />
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      bill?.pricesVerified
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {bill?.pricesVerified ? "Verified prices" : "Draft preview"}
                  </span>
                </div>
              </div>

              {/* KPI Strip */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Participants
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                    {bill?.participantCount ?? 0}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Food Subtotal
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                    {formatMoney(bill?.totalFoodCost ?? 0)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Delivery / Person
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                    {formatMoney(bill?.deliverySharePerPerson ?? 0)}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    Grand Total
                  </p>
                  <p className="mt-1 text-xl font-extrabold tabular-nums text-emerald-950">
                    {formatMoney(bill?.grandTotal ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Delivery Recalculation Strip */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <FiTruck size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Delivery fee calculation
                    </h3>
                    <p className="text-xs text-slate-500">
                      Update the fee to preview how delivery splits equally across participants.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100">
                    <span className="mr-1 text-xs font-bold text-slate-400">EGP</span>
                    <input
                      type="number"
                      min="0"
                      max="10000"
                      step="0.01"
                      {...register("deliveryFee", { valueAsNumber: true })}
                      aria-label="Delivery fee for preview"
                      className="w-24 bg-transparent text-right text-sm font-bold tabular-nums text-slate-900 outline-none"
                    />
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleRefreshPreview}
                    disabled={refreshing || loadingBill}
                    className="cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                      <FiRefreshCw
                        size={13}
                        className={refreshing || loadingBill ? "animate-spin" : ""}
                      />
                      Recalculate
                    </span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Participant Breakdown Table */}
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Participant Breakdown
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Exact amounts calculated by the server for each participant.
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  <FiUsers size={13} />
                  <span>{breakdown.length} active users</span>
                </span>
              </div>

              {breakdown.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No orders found for this room yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <th className="px-5 py-3.5">User</th>
                        <th className="px-5 py-3.5 text-right">Food Subtotal</th>
                        <th className="px-5 py-3.5 text-right">Delivery Share</th>
                        <th className="px-5 py-3.5 text-right">Final Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {breakdown.map((entry) => (
                        <tr key={entry.userId} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-4 font-semibold text-slate-900">
                            {entry.userName || `User #${entry.userId}`}
                          </td>
                          <td className="px-5 py-4 text-right tabular-nums text-slate-700">
                            {formatMoney(entry.foodSubtotal)}
                          </td>
                          <td className="px-5 py-4 text-right tabular-nums text-slate-700">
                            {formatMoney(entry.deliveryShare)}
                          </td>
                          <td className="px-5 py-4 text-right font-bold tabular-nums text-emerald-800">
                            {formatMoney(entry.finalTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                        <td className="px-5 py-3.5">Grand Total Sum</td>
                        <td className="px-5 py-3.5 text-right tabular-nums">
                          {formatMoney(bill?.totalFoodCost ?? 0)}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums">
                          {formatMoney(bill?.totalDelivery ?? 0)}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums text-base text-emerald-900">
                          {formatMoney(bill?.grandTotal ?? 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Workflow Navigation Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
              <Link href={`/admin/rooms/${room.id}/summary`}>
                <Button variant="secondary" size="sm">
                  <span className="inline-flex items-center gap-1.5">
                    <FiArrowLeft size={14} />
                    View Calling Sheet
                  </span>
                </Button>
              </Link>

              <div className="flex items-center gap-2">
                {room.status === "CLOSED" ? (
                  <Link href={`/admin/rooms/${room.id}/receipt`}>
                    <Button size="sm" variant="primary">
                      <span className="inline-flex items-center gap-1.5">
                        <LuReceipt size={14} />
                        Enter Paper Receipt
                      </span>
                    </Button>
                  </Link>
                ) : null}

                {room.status === "PENDING_ADMIN_APPROVAL" ? (
                  <Link href={`/admin/rooms/${room.id}/approval`}>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                      <span className="inline-flex items-center gap-1.5">
                        <FiCheckCircle size={14} />
                        Proceed to Approval
                        <FiArrowRight size={14} />
                      </span>
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </>
  );
}