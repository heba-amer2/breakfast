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
} from "react-icons/fi";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button, EmptyState } from "@/components/ui";
import { RoomApprovalActionsCard } from "@/features/admin/components/RoomApprovalActionsCard";
import { RoomApprovalHeader } from "@/features/admin/components/RoomApprovalHeader";
import { RoomApprovalPriceVerification } from "@/features/admin/components/RoomApprovalPriceVerification";
import { approveRoom } from "@/features/admin/store/adminThunks";
import { fetchBillPreview } from "@/features/billing/store/billingThunks";
import { priceKey } from "@/features/billing/utils/priceKey";
import { fetchRoomOrderSummary } from "@/features/orders/store/orderThunks";
import { fetchRoomById, fetchRoomMenu } from "@/features/rooms/store/roomThunks";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";

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
        const key = priceKey(item.itemName);
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
        const key = priceKey(item.name);
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
            <RoomApprovalHeader
              room={room}
              itemsCount={itemsToApprove.length}
              participantCount={bill?.participantCount ?? summary?.participantCount ?? 0}
              foodSubtotal={foodSubtotal}
              deliveryFee={deliveryFee}
              receiptTotal={receiptTotal}
            />

            {/* Main Content Layout */}
            <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
              {/* Left Column: Price Verification List */}
              <div className="space-y-6">
                <RoomApprovalPriceVerification
                  items={itemsToApprove}
                  priceFor={priceFor}
                  onPriceChange={handlePriceChange}
                  isFinalized={isFinalized}
                />
              </div>

              {/* Right Column: Participant Split Preview & Final Action */}
              <RoomApprovalActionsCard
                bill={bill}
                refreshingPreview={refreshingPreview}
                onRefreshPreview={handleRefreshPreview}
                isFinalized={isFinalized}
                register={register}
                submitting={submitting}
                itemsCount={itemsToApprove.length}
                roomId={roomId}
                onSubmit={handleSubmit(handleApprove)}
              />
            </div>
          </div>
        )}
      </PageContainer>
    </>
  );
}