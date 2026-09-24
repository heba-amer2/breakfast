"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiLock,
  FiPhone,
  FiPhoneCall,
  FiRefreshCw,
  FiShoppingBag,
  FiUsers,
} from "react-icons/fi";
import { LuUtensils } from "react-icons/lu";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button, CountdownTimer, EmptyState, Modal, StatusChip } from "@/components/ui";
import { fetchRoomOrderSummary } from "@/features/orders/store/orderThunks";
import { closeRoom, fetchRoomById, fetchRoomMenu } from "@/features/rooms/store/roomThunks";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import { formatDateTime, formatMoney } from "@/lib/formatters";
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
          <div className="flex items-center gap-2">
            <Link href="/admin/admin-dashboard">
              <Button size="sm" variant="secondary">
                <span className="inline-flex items-center gap-1.5">
                  <FiArrowLeft size={14} />
                  Dashboard
                </span>
              </Button>
            </Link>

            {isOpen ? (
              <Link href={`/user/rooms/${roomId}`}>
                <Button size="sm" variant="secondary" className="cursor-pointer">
                  <span className="inline-flex items-center gap-1.5">
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
                className="cursor-pointer"
              >
                <span className="inline-flex items-center gap-1.5">
                  <FiLock size={14} />
                  Close Room
                </span>
              </Button>
            ) : null}
          </div>
        }
      />

      <PageContainer className="pb-12">
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
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800 shadow-sm">
            {roomError || orderError}
          </div>
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
            {/* Header Hero */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 shadow-xs">
                    <LuUtensils size={24} className="text-emerald-800" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-bold text-slate-900">
                        {room.restaurantName}
                      </h1>
                      <StatusChip status={room.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {room.description || "Office breakfast order"}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
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
                      {isOpen ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                          <CountdownTimer
                            secondsRemaining={room.secondsRemaining}
                            expiresAt={room.expiresAt}
                            size="sm"
                            onExpire={() => {
                              dispatch(fetchRoomById(roomId));
                            }}
                          />
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {room.restaurantPhone ? (
                    <a
                      href={`tel:${room.restaurantPhone}`}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-98"
                    >
                      <FiPhoneCall size={16} />
                      <span>Call {room.restaurantPhone}</span>
                    </a>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-xs font-semibold text-slate-500">
                      <FiPhone size={14} />
                      <span>No phone registered</span>
                    </div>
                  )}

                  {isOpen ? (
                    <Button
                      variant="destructive"
                      size="md"
                      onClick={() => {
                        setCloseError(null);
                        setIsCloseModalOpen(true);
                      }}
                      className="cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-1.5 font-bold">
                        <FiLock size={15} />
                        Close Room
                      </span>
                    </Button>
                  ) : null}
                </div>
              </div>

              {/* 4 KPI Metrics */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Participants
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                    {summary?.participantCount ?? 0}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Total Items
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                    {totalItemsCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Estimated Subtotal
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">
                    {formatMoney(summary?.foodTotal ?? 0)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Pricing Mode
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-800">
                    {summary?.pricesVerified
                      ? "Verified catalog prices"
                      : "User estimated prices"}
                  </p>
                </div>
              </div>
            </div>

            {/* Split Layout: Calling Sheet vs Sidebar Actions */}
            <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
              {/* Aggregated Order Calling Sheet */}
              <div className="space-y-6">
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Restaurant Order Sheet
                      </h2>
                      <p className="text-xs text-slate-500">
                        Read this directly over the phone to the restaurant.
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                      {aggregatedItems.length} unique dish{aggregatedItems.length === 1 ? "" : "es"}
                    </span>
                  </div>

                  {aggregatedItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-sm text-slate-500">
                      No items have been ordered in this room yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {aggregatedItems.map((item, index) => (
                        <div
                          key={`${item.itemName}-${index}`}
                          className="flex items-center justify-between py-3.5 transition hover:bg-slate-50/60 px-2 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-xs">
                              {item.totalQuantity}×
                            </span>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {item.itemName}
                              </p>
                              {typeof item.verifiedUnitPrice === "number" && item.verifiedUnitPrice > 0 ? (
                                <p className="text-xs text-slate-500">
                                  ~{formatMoney(item.verifiedUnitPrice)} each
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-semibold tabular-nums text-slate-800">
                              {formatMoney(
                                item.totalPrice ??
                                  Number(item.totalQuantity ?? 0) *
                                    Number(item.verifiedUnitPrice ?? 0),
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Restaurant Menu Catalog */}
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">
                          Restaurant Menu Catalog
                        </h2>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                          {menu.length} {menu.length === 1 ? "dish" : "dishes"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Dishes registered for {room.restaurantName} available for participants to order.
                      </p>
                    </div>

                    {isOpen ? (
                      <Link href={`/user/rooms/${roomId}`}>
                        <Button size="sm" variant="secondary" className="cursor-pointer">
                          <span className="inline-flex items-center gap-1.5">
                            <FiShoppingBag size={13} />
                            Go to Ordering
                          </span>
                        </Button>
                      </Link>
                    ) : null}
                  </div>

                  {menu.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
                      No catalog dishes registered yet. Participants can order by entering custom dishes.
                    </div>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {menu.map((dish, index) => (
                        <div
                          key={`${dish.name}-${index}`}
                          className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-emerald-200 hover:bg-emerald-50/30"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                              <LuUtensils size={14} />
                            </div>
                            <span className="truncate font-semibold text-sm text-slate-800">
                              {dish.name}
                            </span>
                          </div>
                          <span className="shrink-0 font-bold tabular-nums text-emerald-800 text-sm ml-2">
                            {formatMoney(dish.verifiedPrice ?? dish.price ?? 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Team Participant Breakdown */}
                {participantMap.length > 0 ? (
                  <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-base font-bold text-slate-900">
                      Participant Breakdown ({participantMap.length} people)
                    </h2>
                    <div className="space-y-3">
                      {participantMap.map((p, idx) => (
                        <div
                          key={idx}
                          className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5"
                        >
                          <p className="font-semibold text-slate-900">{p.userName}</p>
                          <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
                            {p.items.map((it, itIdx) => (
                              <li key={itIdx} className="flex items-center gap-2">
                                <span className="font-bold text-emerald-700">
                                  {it.quantity}×
                                </span>
                                <span>{it.itemName}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Sidebar Action Pipeline */}
              <div className="space-y-5">
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
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
                          onClick={() => {
                            setCloseError(null);
                            setIsCloseModalOpen(true);
                          }}
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
            </div>
          </div>
        )}
      </PageContainer>

      {/* Confirmation Modal for Manual Room Close */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => {
          if (!isClosing) {
            setIsCloseModalOpen(false);
            setCloseError(null);
          }
        }}
        title={
          <div className="flex items-center gap-2 text-rose-700 font-bold">
            <FiAlertTriangle size={20} className="shrink-0" />
            <span>Close Breakfast Room #{room?.id}?</span>
          </div>
        }
        description={
          room ? `Stop ordering for ${room.restaurantName}` : undefined
        }
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          {closeError ? (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <FiAlertTriangle size={15} className="shrink-0 text-rose-600" />
              <span>{closeError}</span>
            </div>
          ) : null}

          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to manually close this room before its scheduled duration ends?
          </p>

          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3.5 text-xs text-rose-950 space-y-1.5">
            <p className="font-bold text-rose-900">Important consequences:</p>
            <ul className="list-disc pl-4 space-y-1 text-rose-800/90">
              <li>All users will immediately be blocked from placing, modifying, or deleting orders.</li>
              <li>The room status will transition from <strong className="text-emerald-700">OPEN</strong> to <strong className="text-slate-900">CLOSED</strong>.</li>
              <li>You will immediately be able to enter prices from the paper receipt.</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsCloseModalOpen(false);
                setCloseError(null);
              }}
              disabled={isClosing}
            >
              Keep Room Open
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleCloseRoom}
              disabled={isClosing}
            >
              <span className="inline-flex items-center gap-1.5 font-bold">
                {isClosing ? (
                  <>
                    <FiRefreshCw size={13} className="animate-spin" />
                    Closing…
                  </>
                ) : (
                  <>
                    <FiLock size={13} />
                    Confirm Close Room
                  </>
                )}
              </span>
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}