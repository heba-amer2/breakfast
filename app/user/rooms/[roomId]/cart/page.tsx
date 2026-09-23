"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiClock,
  FiFileText,
  FiPlus,
  FiShoppingBag,
  FiTrash2,
} from "react-icons/fi";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button, CountdownTimer, EmptyState, StatusChip } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import { deleteOrder, fetchMyCart } from "@/features/orders/store/orderThunks";
import { fetchRoomById } from "@/features/rooms/store/roomThunks";
import { formatMoney } from "@/lib/formatters";

export default function CartPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = Number(params.roomId);
  const dispatch = useAppDispatch();

  const room = useAppSelector((state) => state.rooms.currentRoom);
  const cart = useAppSelector((state) => state.orders.items);
  const roomError = useAppSelector((state) => state.rooms.error);
  const orderError = useAppSelector((state) => state.orders.error);

  const [loading, setLoading] = useState(true);

  useAuthFetch(async () => {
    if (!Number.isFinite(roomId)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    await Promise.all([
      dispatch(fetchRoomById(roomId)),
      dispatch(fetchMyCart(roomId)),
    ]);
    setLoading(false);
  }, [roomId]);

  const isOpen = room?.status === "OPEN";

  const cartTotal = cart.reduce((sum, item) => {
    const line =
      typeof item.lineTotal === "number"
        ? item.lineTotal
        : item.priceAtOrder * item.quantity;
    return sum + line;
  }, 0);

  const handleDelete = async (orderId: number) => {
    if (!isOpen) return;
    const result = await dispatch(deleteOrder({ roomId, orderId }));
    if (deleteOrder.fulfilled.match(result)) {
      await dispatch(fetchMyCart(roomId));
    }
  };

  return (
    <>
      <TopBar
        title={room ? `My Cart · ${room.restaurantName}` : "My Cart"}
        subtitle="Review your breakfast order items before the room countdown ends."
        tag="Cart Review"
        actions={
          <Link href={`/user/rooms/${roomId}`}>
            <Button variant="secondary" size="sm">
              <span className="inline-flex items-center gap-1.5">
                <FiArrowLeft size={14} />
                Back to Menu
              </span>
            </Button>
          </Link>
        }
      />

      <PageContainer className="space-y-6 pb-12">
        {roomError || orderError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {roomError || orderError}
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
              {room?.restaurantName ?? "Breakfast Room"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {room?.description || "Shared office breakfast order"}
            </p>
          </div>

          {isOpen ? (
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50/60 px-4 py-3 border border-emerald-100">
              <FiClock size={18} className="text-emerald-600" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Time Remaining
                </p>
                <CountdownTimer
                  secondsRemaining={room?.secondsRemaining}
                  expiresAt={room?.expiresAt}
                  size="md"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-100 px-4 py-3 border border-slate-200 text-xs font-semibold text-slate-700">
              Ordering is closed for this room
            </div>
          )}
        </div>

        {/* Cart Contents & Summary */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          {/* Order Items Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
            <div className="border-b border-slate-100 bg-slate-50/50 p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Order Items ({cart.length})
              </h3>
              {isOpen ? (
                <Link href={`/user/rooms/${roomId}`}>
                  <Button size="sm" variant="ghost">
                    <span className="inline-flex items-center gap-1">
                      <FiPlus size={14} />
                      Add More Dishes
                    </span>
                  </Button>
                </Link>
              ) : null}
            </div>

            {loading ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : cart.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<FiShoppingBag size={28} />}
                  title="Your cart is empty"
                  description="You haven't selected any breakfast dishes yet."
                  action={
                    isOpen ? (
                      <Link href={`/user/rooms/${roomId}`}>
                        <Button size="sm">Browse Restaurant Menu</Button>
                      </Link>
                    ) : undefined
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/30">
                      <th className="px-5 py-3">Dish / Item</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3">Line Total</th>
                      {isOpen ? (
                        <th className="px-4 py-3 text-right">Remove</th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cart.map((item) => {
                      const lineTotal =
                        typeof item.lineTotal === "number"
                          ? item.lineTotal
                          : item.priceAtOrder * item.quantity;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-slate-900">
                              {item.itemName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Order #{item.id}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-700">
                            {formatMoney(item.priceAtOrder)}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold tabular-nums text-slate-900">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3.5 font-bold tabular-nums text-slate-900">
                            {formatMoney(lineTotal)}
                          </td>
                          {isOpen ? (
                            <td className="px-4 py-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                                aria-label="Remove item"
                              >
                                <FiTrash2 size={15} />
                              </button>
                            </td>
                          ) : null}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Cart Summary Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4 self-start">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Order Calculation
            </h3>

            <div className="space-y-2.5 border-b border-slate-100 pb-4 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Selected Dishes</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {cart.length}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Food Subtotal</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatMoney(cartTotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Delivery Share</span>
                <span className="italic text-slate-400">Calculated after receipt</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-sm font-semibold text-slate-900">
                Current Subtotal
              </span>
              <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                {formatMoney(cartTotal)}
              </span>
            </div>

            <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/60 p-3 text-xs text-emerald-800 leading-relaxed">
              <p className="font-semibold mb-0.5">Equal Delivery Split Rule</p>
              When the delivery arrives, the restaurant delivery fee is divided equally among all team members who ordered in this room.
            </div>

            <div className="pt-2 space-y-2">
              <Link href={`/user/rooms/${roomId}/my-bill`} className="block">
                <Button fullWidth size="lg" variant="primary">
                  <span className="inline-flex items-center gap-2">
                    <FiFileText size={16} />
                    View My Bill Split
                  </span>
                </Button>
              </Link>

              <Link href={`/user/rooms/${roomId}`} className="block">
                <Button fullWidth size="md" variant="secondary">
                  Continue Adding Items
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}