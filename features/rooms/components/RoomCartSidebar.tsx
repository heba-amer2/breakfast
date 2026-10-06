"use client";

import Link from "next/link";
import type { FieldErrors, UseFormHandleSubmit, UseFormRegister } from "react-hook-form";
import {
  FiDollarSign,
  FiFileText,
  FiPlus,
  FiShoppingBag,
  FiTrash2,
  FiUser,
} from "react-icons/fi";

import { Button, Input } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrderItemResponse, RoomOrderSummary } from "@/features/orders/store/orderSlice";
import type { CustomItemFormValues } from "@/features/rooms/hooks/useRoomOrdering";
import type { RoomResponse } from "@/features/rooms/store/roomSlice";
import { formatMoney } from "@/lib/formatters";

type RoomCartSidebarProps = {
  roomId: number;
  room: RoomResponse | null;
  cart: OrderItemResponse[];
  cartTotal: number;
  menuNamesSet: Set<string>;
  loading: boolean;
  isOpen: boolean;
  isAdmin: boolean;
  orderSummary: RoomOrderSummary | null;
  onDeleteCartItem: (orderId: number) => void;
  registerCustom: UseFormRegister<CustomItemFormValues>;
  handleCustomSubmit: UseFormHandleSubmit<CustomItemFormValues>;
  onAddCustom: (data: CustomItemFormValues) => void;
  customErrors: FieldErrors<CustomItemFormValues>;
  addingCustom: boolean;
};

export function RoomCartSidebar({
  roomId,
  room,
  cart,
  cartTotal,
  menuNamesSet,
  loading,
  isOpen,
  isAdmin,
  orderSummary,
  onDeleteCartItem,
  registerCustom,
  handleCustomSubmit,
  onAddCustom,
  customErrors,
  addingCustom,
}: RoomCartSidebarProps) {
  return (
    <aside className="space-y-5 xl:sticky xl:top-20 xl:self-start">
      {/* 4. Live User Cart (Desktop Only - Mobile uses floating cart bar) */}
      <div className="hidden xl:block rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <FiShoppingBag size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isOpen ? "My Cart" : "My Order"}
              </h3>
              <p className="text-[11px] text-slate-400">
                {cart.length} {cart.length === 1 ? "dish" : "dishes"} selected
              </p>
            </div>
          </div>

          <span className="text-base font-extrabold tabular-nums text-slate-900">
            {formatMoney(cartTotal)}
          </span>
        </div>

        {loading ? (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ) : cart.length === 0 ? (
          <div className="py-7 text-center">
            <p className="text-xs font-semibold text-slate-700">
              {isOpen ? "Your cart is empty" : "No items in your cart"}
            </p>
            <p className="mt-1 text-[11px] text-slate-400 max-w-xs mx-auto">
              {isOpen
                ? "Select dishes from the verified menu on the left or add a custom dish below."
                : "You did not place any items in this room."}
            </p>
          </div>
        ) : (
          <ul className="mt-3.5 divide-y divide-slate-100 max-h-[340px] overflow-y-auto pr-1">
            {cart.map((item) => {
              const isCustom = !menuNamesSet.has(
                item.itemName.toLowerCase().trim(),
              );
              const unitPrice =
                typeof item.verifiedPrice === "number"
                  ? item.verifiedPrice
                  : item.priceAtOrder;
              const lineTotal =
                typeof item.lineTotal === "number"
                  ? item.lineTotal
                  : item.priceAtOrder * item.quantity;

              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {item.itemName}
                      </p>
                      {isCustom ? (
                        <span className="shrink-0 rounded-md bg-amber-50 px-1.5 py-0.2 text-[9px] font-bold text-amber-700 border border-amber-200/60">
                          Custom
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {item.quantity} &times; {formatMoney(unitPrice)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs font-bold tabular-nums text-slate-900">
                      {formatMoney(lineTotal)}
                    </span>
                    {isOpen ? (
                      <button
                        type="button"
                        onClick={() => onDeleteCartItem(item.id)}
                        aria-label={`Remove ${item.itemName}`}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Subtotal & Delivery Note */}
        <div className="mt-4 border-t border-slate-100 pt-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold">
              Food Subtotal
            </span>
            <span className="font-extrabold text-slate-900 tabular-nums">
              {formatMoney(cartTotal)}
            </span>
          </div>

          <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/60 p-2.5 text-[11px] text-emerald-800 leading-snug">
            <span className="font-bold">Note on delivery:</span> Delivery fee
            is split equally among all room participants once the paper receipt is finalized.
          </div>

          {cart.length > 0 ? (
            <div className="pt-1 flex flex-col gap-2">
              <Link href={`/user/rooms/${roomId}/cart`} className="w-full">
                <Button fullWidth size="sm" variant={isOpen ? "primary" : "secondary"}>
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <FiShoppingBag size={14} />
                    {isOpen ? `Review Cart (${cart.length})` : `View My Cart (${cart.length})`}
                  </span>
                </Button>
              </Link>
              {!isOpen ? (
                <Link href={`/user/rooms/${roomId}/my-bill`} className="w-full">
                  <Button fullWidth size="sm" variant="primary">
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <FiFileText size={14} />
                      View My Bill Split
                    </span>
                  </Button>
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* 3. Custom Dish Entry (ONLY RENDERED WHEN ROOM IS OPEN) */}
      {isOpen ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
          <div className="mb-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Add Custom Dish
              </h3>
              <span className="rounded-full bg-emerald-100/90 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Free-Text Order
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Want something not on the verified menu? Enter the dish name below.
              The price will be verified by an admin from the paper receipt.
            </p>
          </div>

          <form
            onSubmit={handleCustomSubmit(onAddCustom)}
            className="space-y-3"
            noValidate
          >
            <Input
              label="Dish / Item Name *"
              placeholder="e.g. Extra Tahini, Foul with Olive Oil"
              {...registerCustom("customName", {
                required: "Dish name is required",
                validate: (v) =>
                  Boolean(v?.trim()) || "Dish name cannot be empty",
              })}
              error={customErrors.customName?.message}
              disabled={addingCustom}
            />

            <Input
              label="Estimated Price (Optional in EGP)"
              type="number"
              step="0.5"
              min="0"
              placeholder="0.00"
              {...registerCustom("customPrice")}
              disabled={addingCustom}
              hint="Admin will enter the exact price from the receipt"
            />

            <Button
              fullWidth
              size="md"
              type="submit"
              disabled={addingCustom}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <FiPlus size={15} />
                <span>{addingCustom ? "Adding to Cart…" : "Add Custom Dish"}</span>
              </span>
            </Button>
          </form>
        </div>
      ) : null}

      {/* Room Summary & Participants (RENDERED WHEN ROOM IS CLOSED) */}
      {!isOpen && orderSummary ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Room Order Summary
              </h3>
              <p className="text-[11px] text-slate-400">
                {orderSummary.participantCount ?? 0}{" "}
                {orderSummary.participantCount === 1 ? "participant" : "participants"} ordered
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
              Read-Only
            </span>
          </div>

          {orderSummary.aggregatedItems && orderSummary.aggregatedItems.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Ordered Dishes ({orderSummary.aggregatedItems.length})
              </p>
              <ul className="divide-y divide-slate-100 max-h-52 overflow-y-auto pr-1">
                {orderSummary.aggregatedItems.map((item, idx) => (
                  <li
                    key={`${item.itemName}-${idx}`}
                    className="flex items-center justify-between py-2 text-xs"
                  >
                    <span className="font-semibold text-slate-800 truncate pr-2">
                      {item.itemName}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-700 tabular-nums text-[11px]">
                        &times;{item.totalQuantity}
                      </span>
                      {typeof item.totalPrice === "number" ? (
                        <span className="font-bold text-slate-900 tabular-nums">
                          {formatMoney(item.totalPrice)}
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-2">
              No orders were placed in this room.
            </p>
          )}

          {orderSummary.allOrders && orderSummary.allOrders.length > 0 ? (
            <div className="border-t border-slate-100 pt-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Participants
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {Array.from(
                  new Set(
                    orderSummary.allOrders.map(
                      (o) => o.userName || `User #${o.userId}`,
                    ),
                  ),
                ).map((name, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 border border-emerald-100"
                  >
                    <FiUser size={11} className="text-emerald-600" />
                    {name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Direct Action Links */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            {isAdmin && room ? (
              <Link href={`/admin/rooms/${room.id}/summary`} className="block">
                <Button fullWidth size="sm" variant="secondary">
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <FiFileText size={14} />
                    Full Calling Sheet
                  </span>
                </Button>
              </Link>
            ) : null}

            {isAdmin && room && room.status === "CLOSED" ? (
              <Link href={`/admin/rooms/${room.id}/receipt`} className="block">
                <Button fullWidth size="sm" variant="primary">
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <FiDollarSign size={14} />
                    Enter Paper Receipt
                  </span>
                </Button>
              </Link>
            ) : null}

            {room && room.status === "APPROVED_AND_CLOSED" ? (
              <Link href={`/user/rooms/${room.id}/bill`} className="block">
                <Button fullWidth size="sm" variant="secondary">
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <FiFileText size={14} />
                    View Final Team Split Bill
                  </span>
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
