"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

import { clearBillingError } from "@/features/billing/store/billingSlice";
import {
  enterReceipt,
  fetchBillPreview,
} from "@/features/billing/store/billingThunks";
import { priceKey } from "@/features/billing/utils/priceKey";
import { clearOrderError, type RoomOrderSummary } from "@/features/orders/store/orderSlice";
import { fetchRoomOrderSummary } from "@/features/orders/store/orderThunks";
import { clearRoomError } from "@/features/rooms/store/roomSlice";
import { fetchRoomById, fetchRoomMenu } from "@/features/rooms/store/roomThunks";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";

export type ReceiptEntryItem = {
  itemName: string;
  totalQuantity: number;
  totalPrice: number;
  verifiedUnitPrice?: number;
};

export type ReceiptParticipant = {
  userId: number;
  name: string;
  subtotal: number;
  lines: RoomOrderSummary["allOrders"] extends (infer O)[] | undefined
    ? O[]
    : RoomOrderSummary["orders"] extends (infer O)[] | undefined
    ? O[]
    : never[];
};

export function useReceiptEntry() {
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

  const dismissErrors = () => {
    setDismissedError(true);
    dispatch(clearBillingError());
    dispatch(clearOrderError());
    dispatch(clearRoomError());
  };

  return {
    roomId,
    room,
    menu,
    bill,
    receiptDraft,
    roomError,
    orderError,
    billingError,
    loading,
    success,
    dismissedError,
    dismissErrors,
    register,
    summary,
    items,
    participantCount,
    participants,
    priceFor,
    handlePriceChange,
    deliveryFee,
    foodSubtotal,
    computedTotal,
    receiptTotal,
    unpricedItems,
    isOpen,
    isFinalized,
    previewing,
    submitting,
    handlePreview,
    handleSubmit,
  };
}
