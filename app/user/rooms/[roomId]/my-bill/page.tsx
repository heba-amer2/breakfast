"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiCoffee,
  FiFileText,
  FiShield,
  FiShoppingBag,
  FiTruck,
  FiUsers,
} from "react-icons/fi";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button, EmptyState, StatusChip } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import { fetchMyBill } from "@/features/billing/store/billingThunks";
import { fetchMyCart } from "@/features/orders/store/orderThunks";
import { fetchRoomById } from "@/features/rooms/store/roomThunks";
import { formatMoney } from "@/lib/formatters";

export default function MyBillPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = Number(params.roomId);
  const dispatch = useAppDispatch();

  const room = useAppSelector((state) => state.rooms.currentRoom);
  const myBill = useAppSelector((state) => state.billing.myBill);
  const cart = useAppSelector((state) => state.orders.items);
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
      dispatch(fetchMyBill(roomId)),
      dispatch(fetchMyCart(roomId)),
    ]);
    setLoading(false);
  }, [roomId]);

  const isVerified = Boolean(myBill?.pricesVerified);
  const isOpen = room?.status === "OPEN";

  return (
    <>
      <TopBar
        title={room ? `My Bill · ${room.restaurantName}` : "My Breakfast Bill"}
        subtitle="Individual food items, equal delivery share, and final balance."
        tag="Personal Bill"
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/user/rooms/${roomId}`}>
              <Button variant="secondary" size="sm">
                <span className="inline-flex items-center gap-1.5">
                  <FiArrowLeft size={14} />
                  Room Menu
                </span>
              </Button>
            </Link>
            <Link href={`/user/rooms/${roomId}/bill`}>
              <Button variant="ghost" size="sm">
                <span className="inline-flex items-center gap-1.5">
                  <FiUsers size={14} />
                  Full Team Split
                </span>
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
              {room?.restaurantName ?? "Breakfast Room"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {room?.description || "Shared office breakfast order"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                <FiShield size={14} className="text-emerald-600" />
                Receipt Verified by Admin
              </span>
            ) : isOpen ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                <FiClock size={14} className="text-emerald-600" />
                Order In Progress
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">
                <FiClock size={14} className="text-slate-500" />
                Pending Receipt Verification
              </span>
            )}
          </div>
        </div>

        {/* Financial Receipt Card Layout */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          {/* Left Column: Itemized Food Breakdown */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
            <div className="border-b border-slate-100 bg-slate-50/50 p-4">
              <h3 className="text-sm font-bold text-slate-900">
                My Ordered Items ({cart.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isVerified
                  ? "Prices adjusted according to the physical paper receipt."
                  : "Estimated prices from the menu until paper receipt is saved."}
              </p>
            </div>

            {loading ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : cart.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<FiShoppingBag size={28} />}
                  title="No items in this room yet"
                  description="You have not placed any breakfast dishes in this room."
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
                      <th className="px-5 py-3">Item / Dish</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-5 py-3 text-right">Line Total</th>
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
                          <td className="px-5 py-3.5 text-right font-bold tabular-nums text-slate-900">
                            {formatMoney(lineTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column: Receipt Breakdown & Split Math */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FiFileText size={18} className="text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Financial Split
                  </h3>
                </div>
                {isVerified ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Finalized
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                    Estimate
                  </span>
                )}
              </div>

              {/* Itemized Calculation */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <FiCoffee size={14} className="text-slate-400" />
                    Food Items Subtotal
                  </span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {formatMoney(myBill?.foodSubtotal ?? 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <FiTruck size={14} className="text-slate-400" />
                    Delivery Share
                  </span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {formatMoney(myBill?.deliveryShare ?? 0)}
                  </span>
                </div>

                {typeof myBill?.participantCount === "number" &&
                myBill.participantCount > 0 ? (
                  <p className="text-[11px] text-slate-400 pl-5">
                    Divided equally across {myBill.participantCount} room{" "}
                    {myBill.participantCount === 1 ? "participant" : "participants"}.
                  </p>
                ) : null}

                <div className="border-t border-dashed border-slate-200 pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Total Due From Me
                    </p>
                    <p className="text-xs text-slate-500">
                      Food Subtotal + Delivery Share
                    </p>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
                    {formatMoney(myBill?.finalTotal ?? 0)}
                  </p>
                </div>
              </div>

              {/* Trust & Transparency Note */}
              <div
                className={`rounded-xl border p-3 text-xs leading-relaxed ${
                  isVerified
                    ? "border-emerald-200 bg-emerald-50/70 text-emerald-800"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {isVerified ? (
                  <p className="flex items-start gap-2">
                    <FiCheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span>
                      <strong>Verified &amp; Finalized:</strong> This bill has been audited by your office admin from the printed paper receipt.
                    </span>
                  </p>
                ) : (
                  <p className="flex items-start gap-2">
                    <FiClock size={15} className="mt-0.5 shrink-0 text-slate-500" />
                    <span>
                      <strong>Awaiting paper receipt:</strong> Once the restaurant delivers the food and the receipt is entered, your delivery share and exact totals will update.
                    </span>
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Link href={`/user/rooms/${roomId}/bill`} className="block">
                  <Button fullWidth variant="secondary" size="md">
                    <span className="inline-flex items-center gap-2">
                      <FiUsers size={15} />
                      View Entire Room Split
                    </span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}