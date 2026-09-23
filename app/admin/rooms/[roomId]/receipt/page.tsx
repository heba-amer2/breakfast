"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiInfo,
  FiRefreshCw,
  FiSave,
  FiShoppingBag,
  FiTruck,
  FiUsers,
} from "react-icons/fi";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button, EmptyState, StatusChip } from "@/components/ui";
import {
  enterReceipt,
  fetchBillPreview,
} from "@/features/billing/store/billingThunks";
import { fetchRoomOrderSummary } from "@/features/orders/store/orderThunks";
import { fetchRoomById } from "@/features/rooms/store/roomThunks";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import { formatDateTime, formatMoney } from "@/lib/formatters";

const priceKey = (itemName: string) => itemName.trim().toLowerCase();

const stepBase = "flex flex-1 items-center gap-3 rounded-[18px] px-4 py-3";

export default function Page() {
  const params = useParams<{ roomId: string }>();
  const roomId = Number(params.roomId);
  const dispatch = useAppDispatch();

  const room = useAppSelector((state) => state.rooms.currentRoom);
  const summary = useAppSelector((state) => state.orders.summary);
  const bill = useAppSelector((state) => state.billing.bill);
  const receiptDraft = useAppSelector((state) => state.billing.receiptDraft);
  const roomError = useAppSelector((state) => state.rooms.error);
  const orderError = useAppSelector((state) => state.orders.error);
  const billingError = useAppSelector((state) => state.billing.error);

  const [loading, setLoading] = useState(true);
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const { register, watch, setValue } = useForm<{
    deliveryFee: number;
    receiptTotal: string;
  }>({
    defaultValues: {
      deliveryFee: 0,
      receiptTotal: "",
    },
  });

  useEffect(() => {
    if (room) {
      if (typeof room.totalDeliveryFee === "number") {
        setValue("deliveryFee", room.totalDeliveryFee);
      }
      if (typeof room.receiptTotal === "number") {
        setValue("receiptTotal", String(room.receiptTotal));
      }
    }
  }, [room, setValue]);
  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useAuthFetch(async () => {
    if (!Number.isFinite(roomId)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setSuccess(null);
    await Promise.all([
      dispatch(fetchRoomById(roomId)),
      dispatch(fetchRoomOrderSummary(roomId)),
    ]);
    setLoading(false);
  }, [roomId]);

  const items = useMemo(() => summary?.aggregatedItems ?? [], [summary]);

  const orderLines = useMemo(() => summary?.allOrders ?? [], [summary]);

  // Group the raw order lines per participant: useful while typing prices off
  // the paper receipt (who asked for what).
  const participants = useMemo(() => {
    const grouped = new Map<
      number,
      { userId: number; name: string; subtotal: number; lines: typeof orderLines }
    >();

    orderLines.forEach((order) => {
      const entry = grouped.get(order.userId) ?? {
        userId: order.userId,
        name: order.userName || `User #${order.userId}`,
        subtotal: 0,
        lines: [],
      };

      entry.lines.push(order);
      entry.subtotal +=
        typeof order.lineTotal === "number"
          ? order.lineTotal
          : order.priceAtOrder * order.quantity;

      grouped.set(order.userId, entry);
    });

    return Array.from(grouped.values()).sort((a, b) => b.subtotal - a.subtotal);
  }, [orderLines]);

  // Default price per ordered item: the verified menu price when it exists,
  // otherwise the average price the team paid. Admin edits live in overrides,
  // so every default stays derived and no effect has to sync state.
  const defaultPrices = useMemo(() => {
    const map: Record<string, number> = {};

    items.forEach((item) => {
      const quantity = Number(item.totalQuantity ?? 0);
      const average = quantity > 0 ? Number(item.totalPrice ?? 0) / quantity : 0;
      const verified = Number(item.verifiedUnitPrice ?? 0);
      const base = verified > 0 ? verified : average;
      map[priceKey(item.itemName)] = Number(base.toFixed(2));
    });

    return map;
  }, [items]);

  const priceFor = (itemName: string) => {
    const override = priceOverrides[priceKey(itemName)];
    if (typeof override === "number") return override;
    return defaultPrices[priceKey(itemName)] ?? 0;
  };

  const watchedDeliveryFee = watch("deliveryFee");
  const deliveryFee =
    typeof watchedDeliveryFee === "number" && !Number.isNaN(watchedDeliveryFee)
      ? watchedDeliveryFee
      : Number(room?.totalDeliveryFee ?? 0);
  const watchedReceiptTotal = watch("receiptTotal");
  const receiptTotalInput =
    typeof watchedReceiptTotal === "string"
      ? watchedReceiptTotal
      : typeof room?.receiptTotal === "number"
      ? String(room.receiptTotal)
      : "";

  const foodSubtotal = items.reduce(
    (sum, item) => sum + Number(item.totalQuantity ?? 0) * priceFor(item.itemName),
    0,
  );

  const computedTotal = foodSubtotal + deliveryFee;
  const parsedReceiptTotal = Number(receiptTotalInput);
  const receiptTotal =
    receiptTotalInput.trim() !== "" && Number.isFinite(parsedReceiptTotal)
      ? parsedReceiptTotal
      : computedTotal;
  const difference = receiptTotal - computedTotal;
  const totalsMatch = Math.abs(difference) < 0.01;

  const unpricedItems = items.filter((item) => !(priceFor(item.itemName) > 0));

  const isOpen = room?.status === "OPEN";
  const isFinalized = room?.status === "APPROVED_AND_CLOSED";
  const perPerson =
    summary?.participantCount && summary.participantCount > 0
      ? receiptTotal / summary.participantCount
      : null;

  const handlePriceChange = (itemName: string, value: string) => {
    const parsed = Number(value);
    setPriceOverrides((current) => ({
      ...current,
      [priceKey(itemName)]: Number.isFinite(parsed)
        ? Math.min(Math.max(parsed, 0), 100000)
        : 0,
    }));
  };

  const handlePreview = async () => {
    if (!Number.isFinite(roomId)) return;
    setPreviewing(true);
    await dispatch(fetchBillPreview({ roomId, totalDelivery: deliveryFee }));
    setPreviewing(false);
  };

  const handleSubmit = async () => {
    if (!room || items.length === 0) return;

    setSubmitting(true);
    setSuccess(null);

    const result = await dispatch(
      enterReceipt({
        roomId: room.id,
        payload: {
          items: items.map((item) => ({
            name: item.itemName,
            verifiedPrice: Number(priceFor(item.itemName)),
          })),
          totalDelivery: deliveryFee,
          receiptTotal: Number(receiptTotal.toFixed(2)),
        },
      }),
    );

    setSubmitting(false);

    if (enterReceipt.fulfilled.match(result)) {
      setSuccess(
        "Receipt saved. The room is now pending final approval and the split is ready.",
      );
      await dispatch(fetchRoomById(roomId));
    }
  };

  return (
    <>
      <TopBar
        title={room ? `Receipt · ${room.restaurantName}` : "Enter receipt"}
        subtitle={
          room
            ? `Enter the paper receipt for the room opened ${formatDateTime(room.createdAt)}`
            : "Loading room details…"
        }
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

      <PageContainer className="pb-10">
        <div className="mb-5 flex flex-col gap-2 rounded-[24px] border border-slate-200 bg-white p-2 shadow-sm sm:flex-row sm:items-center">
          <div className={`${stepBase} bg-emerald-50`}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
              1
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-800">Enter receipt</p>
              <p className="text-xs text-emerald-700">
                Type the real price printed on the paper receipt.
              </p>
            </div>
          </div>

          <FiArrowRight
            size={16}
            className="hidden shrink-0 text-slate-300 sm:block"
          />

          <div className={stepBase}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
              2
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700">Approve &amp; close</p>
              <p className="text-xs text-slate-500">
                Confirm the split and finalize the room.
              </p>
            </div>
          </div>
        </div>

        {isOpen ? (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-800 shadow-sm">
            This room is still OPEN. You can enter the receipt now, but orders may
            still arrive and change the totals.
          </div>
        ) : null}

        {roomError || orderError || billingError ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {roomError || orderError || billingError}
          </div>
        ) : null}

        {success ? (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <FiCheckCircle size={16} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        ) : null}


        {loading ? (
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-[30px] bg-slate-100" />
            <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="h-96 animate-pulse rounded-[30px] bg-slate-100" />
              <div className="h-96 animate-pulse rounded-[30px] bg-slate-100" />
            </div>
          </div>
        ) : !room ? (
          <EmptyState
            title="Room not found"
            description="This room could not be loaded, so the receipt cannot be entered."
            action={
              <Link href="/admin/admin-dashboard">
                <Button size="sm">Back to dashboard</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <section className="space-y-5">
              <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                      Receipt entry
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">
                      {room.restaurantName}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-600">
                      {room.description || "No room description added yet."}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <FiClock size={14} className="text-slate-400" />
                        Opened {formatDateTime(room.createdAt)}
                      </span>
                      {room.createdByName ? (
                        <span className="inline-flex items-center gap-1.5">
                          <FiUsers size={14} className="text-slate-400" />
                          Opened by {room.createdByName}
                        </span>
                      ) : null}
                      {room.restaurantPhone ? (
                        <span className="inline-flex items-center gap-1.5">
                          <FiFileText size={14} className="text-slate-400" />
                          {room.restaurantPhone}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <StatusChip status={room.status} className="text-sm" />
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Participants
                    </p>
                    <p className="mt-2 text-xl font-bold tabular-nums text-slate-900">
                      {typeof summary?.participantCount === "number"
                        ? summary.participantCount
                        : "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Ordered items
                    </p>
                    <p className="mt-2 inline-flex items-center gap-2 text-xl font-bold tabular-nums text-slate-900">
                      <FiShoppingBag size={16} className="text-slate-400" />
                      {items.length}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Food as ordered
                    </p>
                    <p className="mt-2 text-xl font-bold tabular-nums text-slate-900">
                      {formatMoney(summary?.foodTotal)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Menu prices
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {summary?.pricesVerified
                        ? "Verified — used as defaults"
                        : "Not verified — receipt required"}
                    </p>
                  </div>
                </div>
              </div>


              <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Receipt items
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">
                      Match every ordered item
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Prices start from the verified menu price and fall back to what
                      the team paid. Override them with the values on the receipt.
                    </p>
                  </div>

                  <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    <FiShoppingBag size={12} />
                    {items.length} line{items.length === 1 ? "" : "s"}
                  </div>
                </div>

                {items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    Nobody ordered anything in this room yet, so there is no receipt to
                    enter.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                          <th className="px-2 py-3 font-medium">Item</th>
                          <th className="px-2 py-3 text-right font-medium">Qty</th>
                          <th className="px-2 py-3 text-right font-medium">
                            Ordered total
                          </th>
                          <th className="px-2 py-3 text-right font-medium">
                            Receipt price
                          </th>
                          <th className="px-2 py-3 text-right font-medium">
                            Line total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => {
                          const key = priceKey(item.itemName);
                          const quantity = Number(item.totalQuantity ?? 0);
                          const unitPrice = priceFor(item.itemName);

                          return (
                            <tr
                              key={key}
                              className="border-b border-slate-50 last:border-0"
                            >
                              <td className="px-2 py-3">
                                <p className="font-medium text-slate-900">
                                  {item.itemName}
                                </p>
                                {unitPrice <= 0 ? (
                                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-amber-600">
                                    <FiAlertTriangle size={12} />
                                    Needs a price
                                  </p>
                                ) : null}
                              </td>
                              <td className="px-2 py-3 text-right tabular-nums text-slate-600">
                                {quantity}
                              </td>
                              <td className="px-2 py-3 text-right tabular-nums text-slate-500">
                                {formatMoney(item.totalPrice)}
                              </td>
                              <td className="px-2 py-3">
                                <label className="ml-auto flex w-32 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                                  <FiDollarSign
                                    size={13}
                                    className="shrink-0 text-slate-400"
                                  />
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    disabled={isFinalized}
                                    value={unitPrice}
                                    onChange={(event) =>
                                      handlePriceChange(
                                        item.itemName,
                                        event.target.value,
                                      )
                                    }
                                    aria-label={`Receipt price for ${item.itemName}`}
                                    className="w-full border-0 bg-transparent text-right text-sm tabular-nums text-slate-900 outline-none disabled:cursor-not-allowed disabled:text-slate-400"
                                  />
                                </label>
                              </td>
                              <td className="px-2 py-3 text-right font-semibold tabular-nums text-slate-900">
                                {formatMoney(quantity * unitPrice)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>


              <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Receipt totals
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    Delivery fee &amp; printed total
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      <FiTruck size={14} />
                      Delivery fee
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="10000"
                      step="0.01"
                      disabled={isFinalized}
                      {...register("deliveryFee", { valueAsNumber: true })}
                      className="w-full border-0 bg-transparent text-lg font-bold tabular-nums text-slate-900 outline-none disabled:cursor-not-allowed disabled:text-slate-400"
                    />
                  </label>

                  <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      <FiFileText size={14} />
                      Printed receipt total
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="1000000"
                      step="0.01"
                      disabled={isFinalized}
                      placeholder={computedTotal.toFixed(2)}
                      {...register("receiptTotal")}
                      className="w-full border-0 bg-transparent text-lg font-bold tabular-nums text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400"
                    />
                  </label>
                </div>

                <div
                  className={`mt-4 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${
                    totalsMatch
                      ? "border border-emerald-100 bg-emerald-50 text-emerald-800"
                      : "border border-amber-100 bg-amber-50 text-amber-800"
                  }`}
                >
                  {totalsMatch ? (
                    <FiCheckCircle size={16} className="mt-0.5 shrink-0" />
                  ) : (
                    <FiAlertTriangle size={16} className="mt-0.5 shrink-0" />
                  )}
                  <span>
                    {totalsMatch
                      ? `Receipt total matches the computed total (${formatMoney(computedTotal)}).`
                      : `The receipt total differs from the computed total by ${formatMoney(
                          Math.abs(difference),
                        )} — the server reports this as a reconciliation delta.`}
                  </span>
                </div>
              </div>
            </section>


            <aside className="space-y-4">
              <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Live totals
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  What will be split
                </h3>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                    <span>Food subtotal</span>
                    <span className="font-semibold tabular-nums text-slate-900">
                      {formatMoney(foodSubtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                    <span>Delivery fee</span>
                    <span className="font-semibold tabular-nums text-slate-900">
                      {formatMoney(deliveryFee)}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3">
                    <div className="flex items-center justify-between text-sm text-emerald-800">
                      <span>Grand total</span>
                      <span className="text-lg font-bold tabular-nums">
                        {formatMoney(receiptTotal)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-xs text-emerald-700">
                      <span>Per person</span>
                      <span className="font-semibold tabular-nums">
                        {perPerson === null ? "—" : formatMoney(perPerson)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Button
                    fullWidth
                    size="sm"
                    variant="secondary"
                    onClick={handlePreview}
                    disabled={previewing || !Number.isFinite(roomId)}
                  >
                    <span className="inline-flex items-center gap-2">
                      <FiRefreshCw
                        size={14}
                        className={previewing ? "animate-spin" : ""}
                      />
                      {previewing ? "Previewing…" : "Preview server split"}
                    </span>
                  </Button>
                  <p className="mt-2 text-xs text-slate-400">
                    Estimates above are computed in the browser. Previewing asks the
                    server for the authoritative split.
                  </p>
                </div>
              </div>


              {bill ? (
                <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Server split
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-slate-900">
                        Authoritative preview
                      </h3>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        bill.pricesVerified
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {bill.pricesVerified ? "Verified" : "Not verified"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span>Food cost</span>
                      <span className="font-semibold tabular-nums text-slate-900">
                        {formatMoney(bill.totalFoodCost)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span>Delivery / person</span>
                      <span className="font-semibold tabular-nums text-slate-900">
                        {formatMoney(bill.deliverySharePerPerson)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span>Grand total</span>
                      <span className="font-semibold tabular-nums text-slate-900">
                        {formatMoney(bill.grandTotal)}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-2">
                    {(bill.breakdown ?? []).map((entry) => (
                      <li
                        key={entry.userId}
                        className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm"
                      >
                        <span className="truncate text-slate-700">
                          {entry.userName || `User #${entry.userId}`}
                        </span>
                        <span className="font-semibold tabular-nums text-slate-900">
                          {formatMoney(entry.finalTotal)}
                        </span>
                      </li>
                    ))}
                    {!bill.breakdown || bill.breakdown.length === 0 ? (
                      <li className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">
                        No per-person split returned yet.
                      </li>
                    ) : null}
                  </ul>
                </div>
              ) : null}


              <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Finalize
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  Save the receipt
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Splits the bill with the delivery fee, stores the verified prices and
                  moves the room to PENDING_ADMIN_APPROVAL.
                </p>

                {unpricedItems.length > 0 ? (
                  <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                    {unpricedItems.length} item
                    {unpricedItems.length === 1 ? "" : "s"} still have no price:{" "}
                    {unpricedItems.map((item) => item.itemName).join(", ")}. They come
                    back as unpriced items.
                  </div>
                ) : null}

                {isFinalized ? (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                    <FiInfo size={14} className="mt-0.5 shrink-0" />
                    <span>
                      This room is approved and closed, so the receipt can no longer be
                      changed.
                    </span>
                  </div>
                ) : null}

                <div className="mt-4 space-y-3">
                  <Button
                    fullWidth
                    size="lg"
                    onClick={handleSubmit}
                    disabled={
                      submitting ||
                      items.length === 0 ||
                      isFinalized ||
                      !Number.isFinite(roomId)
                    }
                  >
                    <span className="inline-flex items-center gap-2">
                      <FiSave size={16} />
                      {submitting ? "Saving receipt…" : "Save receipt & split bill"}
                    </span>
                  </Button>

                  <Link
                    href={`/admin/rooms/${
                      Number.isFinite(roomId) ? roomId : ""
                    }/approval`}
                    className="block"
                  >
                    <Button fullWidth variant="ghost">
                      <span className="inline-flex items-center gap-2">
                        <FiArrowRight size={14} />
                        Continue to approval
                      </span>
                    </Button>
                  </Link>
                </div>
              </div>


              {receiptDraft ? (
                <div className="rounded-[30px] border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        Receipt saved
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-emerald-900">
                        Split is ready
                      </h3>
                    </div>
                    <StatusChip status={receiptDraft.status} />
                  </div>

                  <dl className="mt-4 space-y-2 text-sm text-emerald-900">
                    <div className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2">
                      <dt>Grand total</dt>
                      <dd className="font-semibold tabular-nums">
                        {formatMoney(receiptDraft.bill?.grandTotal)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2">
                      <dt>Participants</dt>
                      <dd className="font-semibold tabular-nums">
                        {typeof receiptDraft.bill?.participantCount === "number"
                          ? receiptDraft.bill.participantCount
                          : "—"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2">
                      <dt>Delivery / person</dt>
                      <dd className="font-semibold tabular-nums">
                        {formatMoney(receiptDraft.bill?.deliverySharePerPerson)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2">
                      <dt>Reconciliation delta</dt>
                      <dd className="font-semibold tabular-nums">
                        {formatMoney(receiptDraft.reconciliationDelta)}
                      </dd>
                    </div>
                  </dl>

                  {receiptDraft.unpricedItems &&
                  receiptDraft.unpricedItems.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                      The server reported {receiptDraft.unpricedItems.length} unpriced
                      item(s): {receiptDraft.unpricedItems.join(", ")}.
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <Link href={`/admin/rooms/${roomId}/approval`} className="block">
                      <Button fullWidth variant="secondary">
                        <span className="inline-flex items-center gap-2">
                          Go to approval
                          <FiArrowRight size={14} />
                        </span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : null}
              {participants.length > 0 ? (
                <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Who ordered what
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    {participants.length} participant
                    {participants.length === 1 ? "" : "s"}
                  </h3>

                  <div className="mt-4 space-y-3">
                    {participants.map((participant) => (
                      <div
                        key={participant.userId}
                        className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex min-w-0 items-center gap-1.5 text-sm font-medium text-slate-800">
                            <FiUsers size={14} className="shrink-0 text-slate-400" />
                            <span className="truncate">{participant.name}</span>
                          </span>
                          <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                            {formatMoney(participant.subtotal)}
                          </span>
                        </div>

                        <ul className="mt-2 space-y-1">
                          {participant.lines.map((line) => (
                            <li
                              key={line.id}
                              className="flex items-center justify-between gap-2 text-xs text-slate-600"
                            >
                              <span className="truncate">
                                {line.quantity} × {line.itemName}
                              </span>
                              <span className="shrink-0 tabular-nums">
                                {formatMoney(
                                  typeof line.lineTotal === "number"
                                    ? line.lineTotal
                                    : line.priceAtOrder * line.quantity,
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        )}
      </PageContainer>
    </>
  );
}

