"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiInfo,
  FiRefreshCw,
  FiSave,
  FiShoppingBag,
  FiTruck,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { LuReceipt, LuUtensils } from "react-icons/lu";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button, EmptyState, StatusChip } from "@/components/ui";
import { clearBillingError } from "@/features/billing/store/billingSlice";
import {
  enterReceipt,
  fetchBillPreview,
} from "@/features/billing/store/billingThunks";
import { clearOrderError, type RoomOrderSummary } from "@/features/orders/store/orderSlice";
import { fetchRoomOrderSummary } from "@/features/orders/store/orderThunks";
import { clearRoomError } from "@/features/rooms/store/roomSlice";
import { fetchRoomById, fetchRoomMenu } from "@/features/rooms/store/roomThunks";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import { formatDateTime, formatMoney } from "@/lib/formatters";

const priceKey = (itemName: string) => itemName.trim().toLowerCase();

export default function ReceiptEntryPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = Number(params.roomId);
  const dispatch = useAppDispatch();

  const room = useAppSelector((state) => state.rooms.currentRoom);
  const menu = useAppSelector((state) => state.rooms.roomMenu);
  const reduxSummary = useAppSelector((state) => state.orders.summary);
  const bill = useAppSelector((state) => state.billing.bill);
  const receiptDraft = useAppSelector((state) => state.billing.receiptDraft);
  const roomError = useAppSelector((state) => state.rooms.error);
  const orderError = useAppSelector((state) => state.orders.error);
  const billingError = useAppSelector((state) => state.billing.error);

  const [localSummary, setLocalSummary] = useState<RoomOrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [dismissedError, setDismissedError] = useState(false);

  // Active summary scoped to current room with safe number comparison & fallback
  const summary = useMemo(() => {
    if (
      localSummary &&
      (!localSummary.roomId || Number(localSummary.roomId) === Number(roomId))
    ) {
      return localSummary;
    }
    if (
      reduxSummary &&
      (!reduxSummary.roomId || Number(reduxSummary.roomId) === Number(roomId))
    ) {
      return reduxSummary;
    }
    return null;
  }, [localSummary, reduxSummary, roomId]);

  const { register, control, setValue } = useForm<{
    deliveryFee: number;
    receiptTotal: string;
  }>({
    defaultValues: {
      deliveryFee: 0,
      receiptTotal: "",
    },
  });

  const watchedDeliveryFee = useWatch({ control, name: "deliveryFee" });
  const watchedReceiptTotal = useWatch({ control, name: "receiptTotal" });

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

  useAuthFetch(async () => {
    if (!Number.isFinite(roomId)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setSuccess(null);
    dispatch(clearRoomError());
    dispatch(clearOrderError());
    dispatch(clearBillingError());

    try {
      const [, , summaryResult] = await Promise.all([
        dispatch(fetchRoomById(roomId)),
        dispatch(fetchRoomMenu(roomId)),
        dispatch(fetchRoomOrderSummary(roomId)),
      ]);

      if (fetchRoomOrderSummary.fulfilled.match(summaryResult)) {
        setLocalSummary(summaryResult.payload);
      }
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Robust extraction of aggregated items, individual orders, and participants
  const { items, orderLines, participantCount } = useMemo(() => {
    const rawAggregated = summary?.aggregatedItems ?? summary?.items ?? [];
    const rawOrders = summary?.allOrders ?? summary?.orders ?? [];

    const map = new Map<
      string,
      {
        itemName: string;
        totalQuantity: number;
        totalPrice: number;
        verifiedUnitPrice?: number;
      }
    >();

    // 1. Process aggregated items from summary
    rawAggregated.forEach((item) => {
      const name = (item.itemName ?? item.name ?? "").trim();
      if (!name) return;
      const key = name.toLowerCase();
      const qty = Number(item.totalQuantity ?? item.quantity ?? 0);
      const price = Number(item.totalPrice ?? item.price ?? 0);
      const verified =
        typeof item.verifiedUnitPrice === "number" && item.verifiedUnitPrice > 0
          ? item.verifiedUnitPrice
          : typeof item.verifiedPrice === "number" && item.verifiedPrice > 0
          ? item.verifiedPrice
          : undefined;

      const existing = map.get(key);
      if (existing) {
        existing.totalQuantity += qty;
        existing.totalPrice += price;
        if (verified && (!existing.verifiedUnitPrice || existing.verifiedUnitPrice <= 0)) {
          existing.verifiedUnitPrice = verified;
        }
      } else {
        map.set(key, {
          itemName: name,
          totalQuantity: qty,
          totalPrice: price,
          verifiedUnitPrice: verified,
        });
      }
    });

    // 2. Incorporate all individual order lines to guarantee no dish (including custom dishes) is omitted
    rawOrders.forEach((order) => {
      const name = (order.itemName ?? order.name ?? "").trim();
      if (!name) return;
      const key = name.toLowerCase();
      const qty = Number(order.quantity ?? 1);
      const lineCost =
        typeof order.lineTotal === "number"
          ? order.lineTotal
          : Number(order.priceAtOrder ?? order.price ?? 0) * qty;
      const verified =
        typeof order.verifiedPrice === "number" && order.verifiedPrice > 0
          ? order.verifiedPrice
          : undefined;

      const existing = map.get(key);
      if (existing) {
        if (existing.totalQuantity === 0) {
          existing.totalQuantity = qty;
          existing.totalPrice = lineCost;
        }
        if (verified && (!existing.verifiedUnitPrice || existing.verifiedUnitPrice <= 0)) {
          existing.verifiedUnitPrice = verified;
        }
      } else {
        map.set(key, {
          itemName: name,
          totalQuantity: qty,
          totalPrice: lineCost,
          verifiedUnitPrice: verified,
        });
      }
    });

    const derivedItems = Array.from(map.values());

    const userIds = new Set(rawOrders.map((o) => o.userId).filter(Boolean));
    const derivedParticipantCount =
      typeof summary?.participantCount === "number" && summary.participantCount >= 0
        ? summary.participantCount
        : userIds.size;

    return {
      items: derivedItems,
      orderLines: rawOrders,
      participantCount: derivedParticipantCount,
    };
  }, [summary]);

  // Group raw order lines per participant for quick reference while entering prices
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
          : Number(order.priceAtOrder ?? order.price ?? 0) * Number(order.quantity ?? 1);

      grouped.set(order.userId, entry);
    });

    return Array.from(grouped.values()).sort((a, b) => b.subtotal - a.subtotal);
  }, [orderLines]);

  // Default price per ordered item: verified menu price if available, else average paid
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

  const deliveryFee =
    typeof watchedDeliveryFee === "number" && !Number.isNaN(watchedDeliveryFee)
      ? watchedDeliveryFee
      : Number(room?.totalDeliveryFee ?? 0);

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

  const unpricedItems = items.filter((item) => !(priceFor(item.itemName) > 0));

  const isOpen = room?.status === "OPEN";
  const isFinalized = room?.status === "APPROVED_AND_CLOSED";

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
    if (!Number.isFinite(roomId) || items.length === 0) return;
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
        "Receipt saved successfully. The bill split is ready and the room is pending approval.",
      );
      await dispatch(fetchRoomById(roomId));
    }
  };

  return (
    <>
      <TopBar
        title="Receipt & Bill"
        subtitle="Enter the prices from the paper receipt and review the split before approval."
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
        {/* Workflow steps visual guide */}
        <div className="mb-6 rounded-[24px] border border-slate-200/80 bg-white p-3 shadow-2xs">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 px-3 py-2 text-emerald-800">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
                1
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight">Enter prices</p>
                <p className="text-[10px] text-emerald-700 leading-tight">From paper receipt</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2 text-slate-700">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-xs font-bold text-slate-700">
                2
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight">Reconciliation</p>
                <p className="text-[10px] text-slate-500 leading-tight">Verify totals match</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2 text-slate-700">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-xs font-bold text-slate-700">
                3
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight">Review split</p>
                <p className="text-[10px] text-slate-500 leading-tight">Per-user breakdown</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2 text-slate-700">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-xs font-bold text-slate-700">
                4
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight">Save receipt</p>
                <p className="text-[10px] text-slate-500 leading-tight">Send to approval</p>
              </div>
            </div>
          </div>
        </div>

        {isOpen ? (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 shadow-2xs">
            <FiAlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <span>
              This room is currently <strong>OPEN</strong>. Orders may still arrive and change item quantities.
            </span>
          </div>
        ) : null}

        {!dismissedError && (roomError || orderError || billingError) ? (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-800 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <FiAlertTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-900">
                  {billingError && billingError.toLowerCase().includes("no orders")
                    ? "Room has no orders"
                    : "Unable to process receipt"}
                </p>
                <p className="text-sm font-medium text-rose-700">
                  {billingError && billingError.toLowerCase().includes("no orders")
                    ? "Cannot calculate a bill for a room with no orders. Team members must place orders in the room before a receipt can be finalized and split."
                    : (roomError || orderError || billingError)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDismissedError(true);
                dispatch(clearBillingError());
                dispatch(clearOrderError());
                dispatch(clearRoomError());
              }}
              className="text-rose-400 hover:text-rose-700 p-1 cursor-pointer rounded-lg hover:bg-rose-100/60 transition"
              aria-label="Dismiss error"
            >
              <FiX size={16} />
            </button>
          </div>
        ) : null}

        {success ? (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <FiCheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
              <span className="font-semibold">{success}</span>
            </div>
            <Link href={`/admin/rooms/${roomId}/approval`}>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                <span>Continue to approval</span>
                <FiArrowRight size={14} className="ml-1.5" />
              </Button>
            </Link>
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-4">
            <div className="h-44 animate-pulse rounded-[30px] bg-slate-100" />
            <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
              <div className="h-96 animate-pulse rounded-[30px] bg-slate-100" />
              <div className="h-96 animate-pulse rounded-[30px] bg-slate-100" />
            </div>
          </div>
        ) : !room ? (
          <EmptyState
            title="Room not found"
            description="The requested room could not be loaded."
            action={
              <Link href="/admin/admin-dashboard">
                <Button size="sm">Back to dashboard</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Room Information Card */}
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
                      Financial Entry
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
                        Opened by {room.createdByName}
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
                  <span className="text-[11px] text-slate-400 font-medium">
                    {items.length} unique ordered {items.length === 1 ? "item" : "items"}
                  </span>
                </div>
              </div>

              {/* Room Quick Metrics */}
              <div className="mt-6 hidden lg:grid lg:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Participants
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                    {participantCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Distinct Items
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xl font-bold tabular-nums text-slate-900">
                    <FiShoppingBag size={16} className="text-slate-400" />
                    {items.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Food as Ordered
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                    {formatMoney(
                      typeof summary?.foodTotal === "number"
                        ? summary.foodTotal
                        : foodSubtotal,
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Menu Defaults
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-800">
                    {summary?.pricesVerified
                      ? "Verified menu prices loaded"
                      : "Receipt input required"}
                  </p>
                </div>
              </div>
            </div>



            {/* Unpriced Items Warning Block */}
            {unpricedItems.length > 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 shadow-2xs">
                <div className="flex items-start gap-3">
                  <FiAlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-amber-900">
                      Items still missing a receipt price ({unpricedItems.length})
                    </h4>
                    <p className="text-xs text-amber-800">
                      Please enter the unit price for each item below before saving. The server requires all ordered items to have a verified price.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {unpricedItems.map((item) => (
                        <span
                          key={item.itemName}
                          className="inline-flex items-center rounded-lg border border-amber-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-amber-900 shadow-2xs"
                        >
                          {item.itemName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Main Operational Two-Column Layout */}
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              {/* Left Column: Receipt Items & Totals */}
              <div className="space-y-6">
                {/* Receipt Items Section */}
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Receipt items
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enter the price shown on the paper receipt for each ordered item.
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 self-start sm:self-auto">
                      <LuReceipt size={13} />
                      <span>{items.length} distinct {items.length === 1 ? "dish" : "dishes"}</span>
                    </div>
                  </div>

                  {items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center space-y-2">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <FiShoppingBag size={22} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        No orders placed in this room
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        {isOpen
                          ? "This room is currently OPEN. Room participants must add items and submit orders before a paper receipt can be entered and split."
                          : "This room was closed with 0 participant orders. The server requires at least one order to calculate and split a bill."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {items.map((item, index) => {
                        const key = priceKey(item.itemName);
                        const quantity = Number(item.totalQuantity ?? 0);
                        const unitPrice = priceFor(item.itemName);
                        const lineTotal = quantity * unitPrice;
                        const isMissingPrice = unitPrice <= 0;

                        return (
                          <div
                            key={key}
                            className={`rounded-2xl border p-4 shadow-2xs transition ${
                              isMissingPrice
                                ? "border-amber-200 bg-amber-50/30"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              {/* Left: Item Information */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-base font-bold text-slate-900">
                                    {item.itemName}
                                  </h4>
                                  <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                                    Qty {quantity}
                                  </span>
                                  {isMissingPrice ? (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                      <FiAlertTriangle size={11} />
                                      Needs price
                                    </span>
                                  ) : null}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                  <span>
                                    Ordered total:{" "}
                                    <strong className="text-slate-700">
                                      {formatMoney(item.totalPrice)}
                                    </strong>
                                  </span>
                                  {Number(item.verifiedUnitPrice ?? 0) > 0 ? (
                                    <span>
                                      · Menu verified:{" "}
                                      <strong className="text-slate-700">
                                        {formatMoney(item.verifiedUnitPrice)}
                                      </strong>
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              {/* Right: Receipt Price Input & Line Total */}
                              <div className="flex items-center gap-3 sm:gap-4 self-stretch sm:self-auto justify-between sm:justify-end w-full sm:w-auto pt-2 sm:pt-0 border-t border-slate-100 sm:border-0">
                                <div className="w-32 sm:w-36 flex-1 sm:flex-none">
                                  <label
                                    htmlFor={`price-input-${index}`}
                                    className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400"
                                  >
                                    Receipt price
                                  </label>
                                  <div
                                    className={`relative flex items-center rounded-xl border px-3 py-1.5 transition ${
                                      isMissingPrice
                                        ? "border-amber-300 bg-white ring-2 ring-amber-100"
                                        : "border-slate-200 bg-slate-50 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100"
                                    }`}
                                  >
                                    <span className="mr-1 text-xs font-bold text-slate-400">
                                      EGP
                                    </span>
                                    <input
                                      id={`price-input-${index}`}
                                      type="number"
                                      min="0"
                                      max="100000"
                                      step="0.01"
                                      disabled={isFinalized}
                                      value={unitPrice || ""}
                                      placeholder="0.00"
                                      onChange={(e) =>
                                        handlePriceChange(
                                          item.itemName,
                                          e.target.value,
                                        )
                                      }
                                      aria-label={`Receipt price for ${item.itemName}`}
                                      className="w-full bg-transparent text-right text-sm font-bold tabular-nums text-slate-900 outline-none disabled:cursor-not-allowed disabled:text-slate-400"
                                    />
                                  </div>
                                </div>

                                <div className="min-w-[80px] sm:min-w-[90px] text-right">
                                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Line total
                                  </span>
                                  <span className="text-sm font-bold tabular-nums text-slate-900">
                                    {formatMoney(lineTotal)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Optional Reference: Restaurant Menu Catalog */}
                  {menu && menu.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <LuUtensils className="text-slate-500" size={14} />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Restaurant Menu Catalog ({menu.length} {menu.length === 1 ? "dish" : "dishes"})
                          </h4>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">Reference only</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">
                        These dishes are registered in this restaurant’s menu catalog. Only items actually ordered by room members appear in the receipt above.
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {menu.map((dish) => (
                          <div
                            key={dish.id ?? dish.name}
                            className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white px-3 py-2 text-xs shadow-2xs"
                          >
                            <span className="font-semibold text-slate-800 truncate">{dish.name}</span>
                            <span className="font-bold tabular-nums text-slate-600 shrink-0">
                              {formatMoney(dish.verifiedPrice ?? dish.price ?? 0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Receipt Totals Section */}
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Receipt totals
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Specify the delivery fee and the printed total written on the paper receipt.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4">
                      <label
                        htmlFor="delivery-fee-field"
                        className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700"
                      >
                        <FiTruck size={14} className="text-slate-400" />
                        Delivery fee
                      </label>
                      <div className="relative flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                        <span className="text-xs font-bold text-slate-400 mr-2">
                          EGP
                        </span>
                        <input
                          id="delivery-fee-field"
                          type="number"
                          min="0"
                          max="10000"
                          step="0.01"
                          disabled={isFinalized}
                          {...register("deliveryFee", { valueAsNumber: true })}
                          className="w-full bg-transparent text-base font-bold tabular-nums text-slate-900 outline-none disabled:cursor-not-allowed disabled:text-slate-400"
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        Divided equally among all active participants.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4">
                      <label
                        htmlFor="receipt-total-field"
                        className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700"
                      >
                        <FiFileText size={14} className="text-slate-400" />
                        Printed receipt total
                      </label>
                      <div className="relative flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                        <span className="text-xs font-bold text-slate-400 mr-2">
                          EGP
                        </span>
                        <input
                          id="receipt-total-field"
                          type="number"
                          min="0"
                          max="1000000"
                          step="0.01"
                          disabled={isFinalized}
                          placeholder={computedTotal.toFixed(2)}
                          {...register("receiptTotal")}
                          className="w-full bg-transparent text-base font-bold tabular-nums text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400"
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        The total written on the paper receipt.
                      </p>
                    </div>
                  </div>

                  {/* Summary Comparison */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between py-1">
                      <span>Food subtotal (sum of items):</span>
                      <strong className="text-slate-800 tabular-nums">{formatMoney(foodSubtotal)}</strong>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span>Delivery fee:</span>
                      <strong className="text-slate-800 tabular-nums">{formatMoney(deliveryFee)}</strong>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5 mt-1 font-semibold">
                      <span className="text-slate-800">Expected computed total:</span>
                      <strong className="text-slate-900 tabular-nums">{formatMoney(computedTotal)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Split Preview & Final Action */}
              <div className="space-y-6">
                {/* Live Split Preview Card */}
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Live Split Preview
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Food is charged to whoever ordered it; delivery is divided equally among people with orders.
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        bill?.pricesVerified
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {bill?.pricesVerified ? "Verified" : "Draft preview"}
                    </span>
                  </div>

                  {/* Live Figures */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
                      <span>Food total</span>
                      <span className="font-bold tabular-nums text-slate-900">
                        {formatMoney(bill ? bill.totalFoodCost : foodSubtotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
                      <span>Delivery share / person</span>
                      <span className="font-bold tabular-nums text-slate-900">
                        {formatMoney(
                          bill
                            ? bill.deliverySharePerPerson
                            : participantCount > 0
                            ? deliveryFee / participantCount
                            : summary?.participantCount
                            ? deliveryFee / summary.participantCount
                            : deliveryFee,
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-emerald-900">
                      <span className="font-bold">Grand total</span>
                      <span className="text-base font-extrabold tabular-nums">
                        {formatMoney(bill ? bill.grandTotal : receiptTotal)}
                      </span>
                    </div>
                  </div>

                  <Button
                    fullWidth
                    size="sm"
                    variant="secondary"
                    onClick={handlePreview}
                    disabled={previewing || !Number.isFinite(roomId) || items.length === 0}
                    className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 min-h-[38px] sm:min-h-[36px]"
                  >
                    <span className="inline-flex items-center gap-2 text-xs font-semibold">
                      <FiRefreshCw
                        size={13}
                        className={previewing ? "animate-spin" : ""}
                      />
                      {previewing ? "Previewing…" : "Refresh server split"}
                    </span>
                  </Button>

                  {/* Participant Breakdown */}
                  <div className="space-y-2 pt-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Participant Breakdown
                    </p>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {bill?.breakdown && bill.breakdown.length > 0 ? (
                        bill.breakdown.map((entry) => (
                          <div
                            key={entry.userId}
                            className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs space-y-1"
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
                        ))
                      ) : participants.length > 0 ? (
                        participants.map((p) => {
                          const estimatedDeliveryShare =
                            participants.length > 0
                              ? deliveryFee / participants.length
                              : 0;
                          return (
                            <div
                              key={p.userId}
                              className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between font-bold text-slate-800">
                                <span className="truncate">{p.name}</span>
                                <span className="tabular-nums text-slate-900">
                                  {formatMoney(p.subtotal + estimatedDeliveryShare)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-500">
                                <span>{p.lines.length} {p.lines.length === 1 ? "item" : "items"}</span>
                                <span>Est. delivery: {formatMoney(estimatedDeliveryShare)}</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-400 italic text-center">
                          No participants yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Primary Action Card */}
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Finalize &amp; Submit
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Saves the receipt prices, computes the participant split, and moves the room into the pending approval workflow.
                    </p>
                  </div>

                  {isFinalized ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 flex items-start gap-2">
                      <FiInfo size={14} className="mt-0.5 shrink-0 text-slate-400" />
                      <span>This room is already approved and closed. The receipt cannot be changed.</span>
                    </div>
                  ) : null}

                  <div className="space-y-2.5 pt-1">
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
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                    >
                      <span className="inline-flex items-center gap-2">
                        <FiSave size={16} />
                        {submitting ? "Saving receipt…" : "Save receipt & split bill"}
                      </span>
                    </Button>

                    {items.length === 0 ? (
                      <p className="text-[11px] text-amber-700 text-center font-medium leading-relaxed bg-amber-50 rounded-xl p-2 border border-amber-200/60">
                        Cannot save receipt: No participant orders exist in this room.
                      </p>
                    ) : null}

                    <Link
                      href={`/admin/rooms/${Number.isFinite(roomId) ? roomId : ""}/approval`}
                      className="block"
                    >
                      <Button fullWidth variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 cursor-pointer min-h-[38px] sm:min-h-[36px]">
                        <span className="inline-flex items-center gap-1.5">
                          Continue to approval
                          <FiArrowRight size={14} />
                        </span>
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Saved Receipt Draft Feedback */}
                {receiptDraft ? (
                  <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiCheckCircle className="text-emerald-700" size={16} />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                          Receipt Saved on Server
                        </h4>
                      </div>
                      <StatusChip status={receiptDraft.status} />
                    </div>

                    <div className="space-y-1.5 text-xs text-emerald-950">
                      <div className="flex items-center justify-between rounded-lg bg-white/70 px-2.5 py-1.5">
                        <span>Grand total</span>
                        <strong className="tabular-nums">{formatMoney(receiptDraft.bill?.grandTotal)}</strong>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-white/70 px-2.5 py-1.5">
                        <span>Reconciliation delta</span>
                        <strong className="tabular-nums">{formatMoney(receiptDraft.reconciliationDelta)}</strong>
                      </div>
                    </div>

                    <Link href={`/admin/rooms/${roomId}/approval`} className="block pt-1">
                      <Button fullWidth variant="secondary" size="sm" className="border-emerald-300 text-emerald-900 bg-white hover:bg-emerald-100 cursor-pointer">
                        <span className="inline-flex items-center gap-1.5 font-bold">
                          Go to approval
                          <FiArrowRight size={13} />
                        </span>
                      </Button>
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </>
  );
}
