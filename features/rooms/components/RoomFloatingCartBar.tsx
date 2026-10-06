"use client";

import Link from "next/link";
import { FiShoppingBag } from "react-icons/fi";

import { Button } from "@/components/ui";
import { formatMoney } from "@/lib/formatters";

type RoomFloatingCartBarProps = {
  roomId: number;
  cartLength: number;
  cartTotal: number;
  isOpen: boolean;
};

export function RoomFloatingCartBar({
  roomId,
  cartLength,
  cartTotal,
  isOpen,
}: RoomFloatingCartBarProps) {
  if (cartLength === 0) return null;

  return (
    <div className="fixed bottom-4 left-3.5 right-3.5 z-30 xl:hidden">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-600/30 bg-emerald-900/95 p-3 sm:p-3.5 text-white shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700/80 text-emerald-200">
            <FiShoppingBag size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-emerald-200 truncate">
              {cartLength} {cartLength === 1 ? "dish" : "dishes"} selected
            </p>
            <p className="text-sm font-extrabold tabular-nums text-white">
              {formatMoney(cartTotal)}
            </p>
          </div>
        </div>
        <Link href={`/user/rooms/${roomId}/cart`} className="shrink-0">
          <Button
            size="sm"
            variant="primary"
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold border-none shadow-sm cursor-pointer min-h-[40px] px-3.5"
          >
            <span className="inline-flex items-center gap-1.5">
              <span>{isOpen ? "Review Cart" : "View Order"}</span>
              <FiShoppingBag size={13} />
            </span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
