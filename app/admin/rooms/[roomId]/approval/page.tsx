"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiRefreshCw,
  FiTruck,
  FiUsers,
} from "react-icons/fi";
import { LuReceipt, LuUtensils } from "react-icons/lu";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button, EmptyState, StatusChip } from "@/components/ui";
import { approveRoom } from "@/features/admin/store/adminThunks";
import { fetchBillPreview } from "@/features/billing/store/billingThunks";
import { fetchRoomOrderSummary } from "@/features/orders/store/orderThunks";
import { fetchRoomById, fetchRoomMenu } from "@/features/rooms/store/roomThunks";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import { formatDateTime, formatMoney } from "@/lib/formatters";

export default function RoomApprovalPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = Number(params.roomId);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const room = useAppSelector((state) => state.rooms.currentRoom);
  const menu = useAppSelector((state) => state.rooms.roomMenu);
  const summary = useAppSelector((state) => state.orders.summary);
  const bill = useAppSelector((state) => state.billing.bill);
  const roomError = useAppSelector((state) => state.rooms.error);
  const adminError = useAppSelector((state) => state.admin.error);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshingPreview, setRefreshingPreview] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, control, handleSubmit, setValue } = useForm<{
    deliveryFee: number;
    saveToMenu: boolean;
  }>({
    defaultValues: {
      deliveryFee: 0,
      saveToMenu: true,
    },
  });

  const watchedDeliveryFee = useWatch({ control, name: "deliveryFee" });
  const deliveryFee = Number(watchedDeliveryFee ?? 0);

  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});

  const priceFor = (name: string, defaultPrice: number) => {
    const override = priceOverrides[name.toLowerCase()];
    return typeof override === "number" ? override : defaultPrice;
  };

  useAuthFetch(async () => {
    if (!Number.isFinite(roomId)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setSuccess(null);
    await Promise.all([
      dispatch(fetchRoomById(roomId)),
      dispatch(fetchRoomMenu(roomId)),
      dispatch(fetchRoomOrderSummary(roomId)),
    ]);
    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    if (
      room &&
      (room.status === "PENDING_ADMIN_APPROVAL" ||
        room.status === "APPROVED_AND_CLOSED")
    ) {
      const initialDelivery = Number(
        room.totalDeliveryFee ?? (typeof room.receiptTotal === "number" ? 0 : 0),
      );
      setValue("deliveryFee", initialDelivery);
      dispatch(fetchBillPreview({ roomId, totalDelivery: initialDelivery }));
    }
  }, [room, roomId, dispatch, setValue]);

  // Combine ordered aggregated items with verified menu catalog to guarantee every dish is covered
  const itemsToApprove = useMemo(() => {
    const list: Array<{ name: string; initialPrice: number; quantity?: number }> = [];
    const seen = new Set<string>();

    // 1. First add all ordered items from summary (includes both catalog & custom free-text items)
    if (summary?.aggregatedItems && summary.aggregatedItems.length > 0) {
      summary.aggregatedItems.forEach((item) => {
        const key = item.itemName.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          const price =
            Number(item.verifiedUnitPrice ?? 0) > 0
              ? Number(item.verifiedUnitPrice)
              : Number(item.totalQuantity ?? 0) > 0
              ? Number(item.totalPrice ?? 0) / Number(item.totalQuantity)
              : 0;

          list.push({
            name: item.itemName,
            initialPrice: Number(price.toFixed(2)),
            quantity: item.totalQuantity,
          });
        }
      });
    }

    // 2. If no ordered summary, fallback to room menu
    if (list.length === 0 && menu.length > 0) {
      menu.forEach((item) => {
        const key = item.name.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            name: item.name,
            initialPrice: Number(item.verifiedPrice ?? 0),
          });
        }
      });
    }

    return list;
  }, [summary, menu]);

  const handlePriceChange = (name: string, value: string) => {
    const parsed = Number(value);
    setPriceOverrides((current) => ({
      ...current,
      [name.toLowerCase()]: Number.isFinite(parsed) ? Math.max(0, parsed) : 0,
    }));
  };

  const foodSubtotal = useMemo(() => {
    return itemsToApprove.reduce((sum, item) => {
      const override = priceOverrides[item.name.toLowerCase()];
      const price = typeof override === "number" ? override : item.initialPrice;
      const qty = item.quantity ?? 1;
      return sum + price * qty;
    }, 0);
  }, [itemsToApprove, priceOverrides]);

  const receiptTotal = foodSubtotal + deliveryFee;

  const handleRefreshPreview = async () => {
    if (!Number.isFinite(roomId)) return;
    setRefreshingPreview(true);
    await dispatch(fetchBillPreview({ roomId, totalDelivery: deliveryFee }));
    setRefreshingPreview(false);
  };

  const handleApprove = async (formData: {
    deliveryFee: number;
    saveToMenu: boolean;
  }) => {
    if (!room || itemsToApprove.length === 0) return;

    const effectiveDelivery =
      typeof formData.deliveryFee === "number" ? formData.deliveryFee : deliveryFee;
    const effectiveSaveToMenu = Boolean(formData.saveToMenu);
    const finalReceiptTotal = Number((foodSubtotal + effectiveDelivery).toFixed(2));

    setSubmitting(true);
    setSuccess(null);

    const result = await dispatch(
      approveRoom({
        roomId: room.id,
        payload: {
          items: itemsToApprove.map((item) => ({
            name: item.name,
            verifiedPrice: Number(priceFor(item.name, item.initialPrice)),
          })),
          totalDelivery: effectiveDelivery,
          receiptTotal: finalReceiptTotal,
          saveToMenu: effectiveSaveToMenu,
        },
      }),
    );

    setSubmitting(false);

    if (approveRoom.fulfilled.match(result)) {
      setSuccess("Room approved successfully. Bills are finalized.");
      router.push(`/admin/rooms/${room.id}/summary`);
    }
  };

  const isOpen = room?.status === "OPEN";
  const isFinalized = room?.status === "APPROVED_AND_CLOSED";

  return (
    <>
      <TopBar
        title={room?.restaurantName ? `Approve · ${room.restaurantName}` : "Approve Room"}
        subtitle="Review verified prices, inspect participant bill splits, and finalize room closure."
        tag="ADMIN OPS"
        actions={
          <Link
            href={`/admin/rooms/${Number.isFinite(roomId) ? roomId : ""}/summary`}
            className="w-full sm:w-auto"
          >
            <Button size="sm" variant="secondary" className="w-full sm:w-auto min-h-[38px] sm:min-h-[36px]">
              <span className="inline-flex items-center justify-center gap-1.5">
                <FiArrowLeft size={14} />
                Back to summary
              </span>
            </Button>
          </Link>
        }
      />

      <PageContainer className="space-y-4 sm:space-y-6 pb-8 sm:pb-12">
        {isOpen ? (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-900 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <FiClock size={18} className="shrink-0 text-amber-600" />
              <span>
                <strong>This room is currently OPEN:</strong> Orders may still arrive. Approvals should normally occur once orders have closed and the paper receipt is recorded.
              </span>
            </div>
            <Link href={`/admin/rooms/${roomId}/summary`}>
              <Button variant="secondary" size="sm">
                View Calling Sheet
              </Button>
            </Link>
          </div>
        ) : null}

        {roomError || adminError ? (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-2xs">
            <FiAlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{roomError || adminError}</span>
          </div>
        ) : null}

        {success ? (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800 shadow-2xs">
            <FiCheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="font-semibold">{success}</span>
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-4">
            <div className="h-44 animate-pulse rounded-[30px] bg-slate-100" />
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div className="h-96 animate-pulse rounded-[30px] bg-slate-100" />
              <div className="h-96 animate-pulse rounded-[30px] bg-slate-100" />
            </div>
          </div>
        ) : !room ? (
          <EmptyState
            title="Room not found"
            description="The requested room could not be loaded."
            action={
              <Link href="/admin/approval-queue?tab=closed&stage=approval">
                <Button size="sm">Back to approvals</Button>
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
                      Final Approval
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
                      Opened {formatDateTime(room.createdAt)}
                    </span>
                    {room.createdByName ? (
                      <span className="inline-flex items-center gap-1.5">
                        <FiUsers size={13} className="text-slate-400" />
                        Host: {room.createdByName}
                      </span>
                    ) : null}
                    {room.restaurantPhone ? (
                      <span className="inline-flex items-center gap-1.5">
                        <FiFileText size={13} className="text-slate-400" />
                        {room.restaurantPhone}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusChip status={room.status} className="text-sm" />
                  <span className="text-xs text-slate-500 font-medium">
                    {itemsToApprove.length} items to approve
                  </span>
                </div>
              </div>

              {/* 4 Financial KPI Metrics */}
              <div className="mt-6 hidden lg:grid lg:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 sm:p-3.5 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                    Participants
                  </p>
                  <p className="mt-1 text-lg sm:text-xl font-bold tabular-nums text-slate-900 truncate">
                    {bill?.participantCount ?? summary?.participantCount ?? 0}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 sm:p-3.5 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                    Food Subtotal
                  </p>
                  <p className="mt-1 text-lg sm:text-xl font-bold tabular-nums text-slate-900 truncate">
                    {formatMoney(foodSubtotal)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 sm:p-3.5 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                    Delivery Fee
                  </p>
                  <p className="mt-1 text-lg sm:text-xl font-bold tabular-nums text-slate-900 truncate">
                    {formatMoney(deliveryFee)}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3 sm:p-3.5 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 truncate">
                    Final Grand Total
                  </p>
                  <p className="mt-1 text-lg sm:text-xl font-extrabold tabular-nums text-emerald-950 truncate">
                    {formatMoney(receiptTotal)}
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content Layout */}
            <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
              {/* Left Column: Price Verification List */}
              <div className="space-y-6">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3.5">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Item Price Verification
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Confirm or adjust prices before approving. Approved prices can update the restaurant catalog.
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 self-start sm:self-auto">
                      <LuReceipt size={13} />
                      <span>{itemsToApprove.length} dishes</span>
                    </span>
                  </div>

                  {itemsToApprove.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                      No items to approve for this room.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {itemsToApprove.map((item, index) => {
                        const price = priceFor(item.name, item.initialPrice);
                        const lineTotal = (item.quantity ?? 1) * price;

                        return (
                          <div
                            key={`${item.name}-${index}`}
                            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:border-slate-300 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900">
                                  {item.name}
                                </h4>
                                {typeof item.quantity === "number" ? (
                                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                                    Qty {item.quantity}
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-xs text-slate-500">
                                Line total:{" "}
                                <strong className="text-slate-800 tabular-nums">
                                  {formatMoney(lineTotal)}
                                </strong>
                              </p>
                            </div>

                            <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end w-full sm:w-auto pt-2 sm:pt-0 border-t border-slate-100 sm:border-0">
                              <span className="text-xs font-semibold text-slate-400">
                                Verified Price
                              </span>
                              <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100">
                                <span className="mr-1 text-xs font-bold text-slate-400">
                                  EGP
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100000"
                                  step="0.01"
                                  disabled={isFinalized}
                                  value={price || ""}
                                  placeholder="0.00"
                                  onChange={(e) =>
                                    handlePriceChange(item.name, e.target.value)
                                  }
                                  aria-label={`Verified price for ${item.name}`}
                                  className="w-24 bg-transparent text-right text-sm font-bold tabular-nums text-slate-900 outline-none disabled:cursor-not-allowed disabled:text-slate-400"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Participant Split Preview & Final Action */}
              <div className="space-y-6">
                {/* Live Split Preview */}
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Participant Split Breakdown
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Dynamic per-user share calculated by the backend.
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRefreshPreview}
                      disabled={refreshingPreview}
                      className="cursor-pointer"
                    >
                      <FiRefreshCw
                        size={13}
                        className={refreshingPreview ? "animate-spin text-emerald-600" : "text-slate-500"}
                      />
                    </Button>
                  </div>

                  {bill?.breakdown && bill.breakdown.length > 0 ? (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {bill.breakdown.map((entry) => (
                        <div
                          key={entry.userId}
                          className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span className="truncate">
                              {entry.userName || `User #${entry.userId}`}
                            </span>
                            <span className="tabular-nums text-emerald-800">
                              {formatMoney(entry.finalTotal)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Food: {formatMoney(entry.foodSubtotal)}</span>
                            <span>Delivery: {formatMoney(entry.deliveryShare)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-400 italic">
                      No orders to calculate split yet.
                    </p>
                  )}
                </div>

                {/* Final Sign-Off & Approval Controls */}
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Room Approval &amp; Closure
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Finalizes room status to <code>APPROVED_AND_CLOSED</code>, creates finalized individual bills, and optionally saves newly verified prices back to the restaurant menu.
                    </p>
                  </div>

                  {/* Delivery Fee Input */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 space-y-1">
                    <label
                      htmlFor="approval-delivery-fee"
                      className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700"
                    >
                      <FiTruck size={14} className="text-slate-400" />
                      Final delivery fee (EGP)
                    </label>
                    <input
                      id="approval-delivery-fee"
                      type="number"
                      min="0"
                      max="10000"
                      step="0.01"
                      disabled={isFinalized}
                      {...register("deliveryFee", { valueAsNumber: true })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-bold tabular-nums text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  {/* Save to Menu Toggle */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                    <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={isFinalized}
                        {...register("saveToMenu")}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>
                        <strong className="block text-slate-900">
                          Save verified prices back to restaurant menu
                        </strong>
                        <span className="text-slate-500">
                          Updates the catalog so future orders start with these verified prices.
                        </span>
                      </span>
                    </label>
                  </div>

                  {/* Approval Submit Button */}
                  <div className="space-y-2 pt-1">
                    <Button
                      fullWidth
                      size="lg"
                      type="button"
                      onClick={handleSubmit(handleApprove)}
                      disabled={
                        submitting ||
                        itemsToApprove.length === 0 ||
                        isFinalized ||
                        !Number.isFinite(roomId)
                      }
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 shadow-sm cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-2">
                        <FiCheckCircle size={16} />
                        {submitting ? "Approving room…" : "Approve & finalize room"}
                      </span>
                    </Button>

                    <Link href={`/admin/rooms/${room.id}/summary`} className="block">
                      <Button fullWidth variant="ghost" size="sm" className="text-slate-600 cursor-pointer min-h-[38px] sm:min-h-[36px]">
                        Cancel &amp; return to summary
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </>
  );
}