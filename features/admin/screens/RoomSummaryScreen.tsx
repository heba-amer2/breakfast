"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiLock,
  FiShoppingBag,
} from "react-icons/fi";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button, EmptyState, ErrorBanner } from "@/components/ui";
import { CloseRoomConfirmModal } from "@/features/admin/components/CloseRoomConfirmModal";
import { RoomMenuCatalog } from "@/features/admin/components/RoomMenuCatalog";
import { RoomOrderSheet } from "@/features/admin/components/RoomOrderSheet";
import { RoomParticipantsOrders } from "@/features/admin/components/RoomParticipantsOrders";
import { RoomSummaryHeader } from "@/features/admin/components/RoomSummaryHeader";
import { RoomWorkflowCard } from "@/features/admin/components/RoomWorkflowCard";
import { fetchRoomOrderSummary } from "@/features/orders/store/orderThunks";
import { closeRoom, fetchRoomById, fetchRoomMenu } from "@/features/rooms/store/roomThunks";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import { formatDateTime } from "@/lib/formatters";
import { isRoomActive } from "@/lib/roomUtils";

export default function AdminRoomSummaryPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = Number(params.roomId);
  const dispatch = useAppDispatch();

  const room = useAppSelector((state) => state.rooms.currentRoom);
  const summary = useAppSelector((state) => state.orders.summary);
  const menu = useAppSelector((state) => state.rooms.roomMenu);
  const roomError = useAppSelector((state) => state.rooms.error);
  const orderError = useAppSelector((state) => state.orders.error);

  const [loading, setLoading] = useState(true);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [closeSuccess, setCloseSuccess] = useState<string | null>(null);

  useAuthFetch(async () => {
    if (!Number.isFinite(roomId)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    await Promise.all([
      dispatch(fetchRoomById(roomId)),
      dispatch(fetchRoomOrderSummary(roomId)),
      dispatch(fetchRoomMenu(roomId)),
    ]);
    setLoading(false);
  }, [roomId]);

  const aggregatedItems = useMemo(
    () => summary?.aggregatedItems ?? [],
    [summary],
  );

  const allOrders = useMemo(() => summary?.allOrders ?? [], [summary]);

  const totalItemsCount = useMemo(() => {
    return aggregatedItems.reduce(
      (sum, item) => sum + (Number(item.totalQuantity) || 0),
      0,
    );
  }, [aggregatedItems]);

  const participantMap = useMemo(() => {
    const map = new Map<
      number,
      { userName: string; items: Array<{ itemName: string; quantity: number }> }
    >();

    allOrders.forEach((o) => {
      const existing = map.get(o.userId) ?? {
        userName: o.userName || `User #${o.userId}`,
        items: [],
      };
      existing.items.push({
        itemName: o.itemName,
        quantity: o.quantity,
      });
      map.set(o.userId, existing);
    });

    return Array.from(map.values());
  }, [allOrders]);

  const handleCloseRoom = async () => {
    if (!room) return;
    setIsClosing(true);
    setCloseError(null);

    const result = await dispatch(closeRoom(room.id));

    setIsClosing(false);

    if (closeRoom.fulfilled.match(result)) {
      setCloseSuccess(
        "Room closed successfully. Orders are now locked and the room is ready for receipt entry.",
      );
      setIsCloseModalOpen(false);
      await Promise.all([
        dispatch(fetchRoomById(roomId)),
        dispatch(fetchRoomOrderSummary(roomId)),
      ]);
    } else {
      setCloseError(
        typeof result.payload === "string"
          ? result.payload
          : "Failed to close room. Please try again.",
      );
    }
  };

  const isOpen = isRoomActive(room);

  return (
    <>
      <TopBar
        title={room?.restaurantName ? `${room.restaurantName} · Order Sheet` : "Room Summary"}
        subtitle={
          room
            ? `Room #${room.id} opened ${formatDateTime(room.createdAt)} by ${
                room.createdByName ?? "Admin"
              }`
            : "Aggregated breakfast orders and calling summary."
        }
        tag="ADMIN OPS"
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Link href="/admin/admin-dashboard" className="flex-1 sm:flex-none">
              <Button size="sm" variant="secondary" className="w-full sm:w-auto min-h-[38px] sm:min-h-[36px]">
                <span className="inline-flex items-center justify-center gap-1.5">
                  <FiArrowLeft size={14} />
                  Dashboard
                </span>
              </Button>
            </Link>

            {isOpen ? (
              <Link href={`/user/rooms/${roomId}`} className="flex-1 sm:flex-none">
                <Button size="sm" variant="secondary" className="cursor-pointer w-full sm:w-auto min-h-[38px] sm:min-h-[36px]">
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <FiShoppingBag size={14} />
                    Ordering View
                  </span>
                </Button>
              </Link>
            ) : null}

            {isOpen ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setCloseError(null);
                  setIsCloseModalOpen(true);
                }}
                className="cursor-pointer flex-1 sm:flex-none w-full sm:w-auto min-h-[38px] sm:min-h-[36px]"
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  <FiLock size={14} />
                  Close Room
                </span>
              </Button>
            ) : null}
          </div>
        }
      />

      <PageContainer className="space-y-4 sm:space-y-6 pb-8 sm:pb-12">
        {/* Success Alert Banner */}
        {closeSuccess ? (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <FiCheckCircle size={18} className="shrink-0 text-emerald-600" />
              <span className="font-semibold">{closeSuccess}</span>
            </div>
            <Link href={`/admin/rooms/${roomId}/receipt`}>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  Proceed to Receipt Entry
                  <FiArrowRight size={14} />
                </span>
              </Button>
            </Link>
          </div>
        ) : null}

        {/* Global Error Banner */}
        {roomError || orderError ? (
          <ErrorBanner className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800 shadow-sm">
            {roomError || orderError}
          </ErrorBanner>
        ) : null}

        {loading ? (
          <div className="space-y-4">
            <div className="h-44 animate-pulse rounded-3xl bg-slate-100" />
            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
              <div className="h-80 animate-pulse rounded-3xl bg-slate-100" />
              <div className="h-80 animate-pulse rounded-3xl bg-slate-100" />
            </div>
          </div>
        ) : !room ? (
          <EmptyState
            title="Room not found"
            description="This breakfast room may have been removed or does not exist."
            action={
              <Link href="/admin/admin-dashboard">
                <Button variant="secondary" size="sm">
                  Return to Dashboard
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-6">
            <RoomSummaryHeader
              room={room}
              isOpen={isOpen}
              summary={summary}
              totalItemsCount={totalItemsCount}
              onExpire={() => {
                dispatch(fetchRoomById(roomId));
              }}
              onOpenCloseModal={() => {
                setCloseError(null);
                setIsCloseModalOpen(true);
              }}
            />

            {/* Split Layout: Calling Sheet vs Sidebar Actions */}
            <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
              {/* Aggregated Order Calling Sheet */}
              <div className="space-y-6">
                <RoomOrderSheet aggregatedItems={aggregatedItems} />

                <RoomMenuCatalog
                  menu={menu}
                  restaurantName={room.restaurantName}
                  isOpen={isOpen}
                  roomId={roomId}
                />

                <RoomParticipantsOrders participantMap={participantMap} />
              </div>

              <RoomWorkflowCard
                room={room}
                onOpenCloseModal={() => {
                  setCloseError(null);
                  setIsCloseModalOpen(true);
                }}
              />
            </div>
          </div>
        )}
      </PageContainer>

      <CloseRoomConfirmModal
        isOpen={isCloseModalOpen}
        roomId={room?.id}
        restaurantName={room?.restaurantName}
        error={closeError}
        isClosing={isClosing}
        onClose={() => {
          setIsCloseModalOpen(false);
          setCloseError(null);
        }}
        onConfirm={handleCloseRoom}
        message={
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to manually close this room before its
            scheduled duration ends?
          </p>
        }
        extraContent={
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3.5 text-xs text-rose-950 space-y-1.5">
            <p className="font-bold text-rose-900">Important consequences:</p>
            <ul className="list-disc pl-4 space-y-1 text-rose-800/90">
              <li>
                All users will immediately be blocked from placing, modifying,
                or deleting orders.
              </li>
              <li>
                The room status will transition from{" "}
                <strong className="text-emerald-700">OPEN</strong> to{" "}
                <strong className="text-slate-900">CLOSED</strong>.
              </li>
              <li>
                You will immediately be able to enter prices from the paper
                receipt.
              </li>
            </ul>
          </div>
        }
        cancelLabel="Keep Room Open"
        confirmLabel="Confirm Close Room"
      />
    </>
  );
}