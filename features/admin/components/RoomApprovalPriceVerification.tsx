import React from "react";
import { LuReceipt } from "react-icons/lu";
import { formatMoney } from "@/lib/formatters";

export interface ItemToApprove {
  name: string;
  initialPrice: number;
  quantity?: number;
}

interface RoomApprovalPriceVerificationProps {
  items: ItemToApprove[];
  priceFor: (name: string, defaultPrice: number) => number;
  onPriceChange: (name: string, value: string) => void;
  isFinalized: boolean;
}

export function RoomApprovalPriceVerification({
  items,
  priceFor,
  onPriceChange,
  isFinalized,
}: RoomApprovalPriceVerificationProps) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3.5">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Item Price Verification
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Confirm or adjust prices before approving. Approved prices can update the restaurant catalog.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 self-start sm:self-auto">
          <LuReceipt size={13} />
          <span>{items.length} dishes</span>
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No items to approve for this room.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const price = priceFor(item.name, item.initialPrice);
            const lineTotal = (item.quantity ?? 1) * price;

            return (
              <div
                key={`${item.name}-${index}`}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:border-slate-300 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900">
                      {item.name}
                    </h4>
                    {typeof item.quantity === "number" ? (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                        Qty {item.quantity}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500">
                    Line total:{" "}
                    <strong className="text-slate-800 tabular-nums">
                      {formatMoney(lineTotal)}
                    </strong>
                  </p>
                </div>

                <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end w-full sm:w-auto pt-2 sm:pt-0 border-t border-slate-100 sm:border-0">
                  <span className="text-xs font-semibold text-slate-400">
                    Verified Price
                  </span>
                  <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100">
                    <span className="mr-1 text-xs font-bold text-slate-400">
                      EGP
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="100000"
                      step="0.01"
                      disabled={isFinalized}
                      value={price || ""}
                      placeholder="0.00"
                      onChange={(e) =>
                        onPriceChange(item.name, e.target.value)
                      }
                      aria-label={`Verified price for ${item.name}`}
                      className="w-24 bg-transparent text-right text-sm font-bold tabular-nums text-slate-900 outline-none disabled:cursor-not-allowed disabled:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

