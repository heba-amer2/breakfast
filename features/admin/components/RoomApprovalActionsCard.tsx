import React from "react";
import Link from "next/link";
import { FiCheckCircle, FiRefreshCw, FiTruck } from "react-icons/fi";
import { UseFormRegister } from "react-hook-form";
import { Button } from "@/components/ui";
import { formatMoney } from "@/lib/formatters";
import type { BillResponse } from "@/features/billing/store/billingSlice";

interface RoomApprovalActionsCardProps {
  bill: BillResponse | null;
  refreshingPreview: boolean;
  onRefreshPreview: () => void;
  isFinalized: boolean;
  register: UseFormRegister<{ deliveryFee: number; saveToMenu: boolean }>;
  submitting: boolean;
  itemsCount: number;
  roomId: number;
  onSubmit: () => void;
}

export function RoomApprovalActionsCard({
  bill,
  refreshingPreview,
  onRefreshPreview,
  isFinalized,
  register,
  submitting,
  itemsCount,
  roomId,
  onSubmit,
}: RoomApprovalActionsCardProps) {
  return (
    <div className="space-y-6">
      {/* Live Split Preview */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Participant Split Breakdown
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dynamic per-user share calculated by the backend.
            </p>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={onRefreshPreview}
            disabled={refreshingPreview}
            className="cursor-pointer"
          >
            <FiRefreshCw
              size={13}
              className={refreshingPreview ? "animate-spin text-emerald-600" : "text-slate-500"}
            />
          </Button>
        </div>

        {bill?.breakdown && bill.breakdown.length > 0 ? (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {bill.breakdown.map((entry) => (
              <div
                key={entry.userId}
                className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs space-y-1"
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
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-400 italic">
            No orders to calculate split yet.
          </p>
        )}
      </div>

      {/* Final Sign-Off & Approval Controls */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Room Approval &amp; Closure
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Finalizes room status to <code>APPROVED_AND_CLOSED</code>, creates finalized individual bills, and optionally saves newly verified prices back to the restaurant menu.
          </p>
        </div>

        {/* Delivery Fee Input */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 space-y-1">
          <label
            htmlFor="approval-delivery-fee"
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            <FiTruck size={14} className="text-slate-400" />
            Final delivery fee (EGP)
          </label>
          <input
            id="approval-delivery-fee"
            type="number"
            min="0"
            max="10000"
            step="0.01"
            disabled={isFinalized}
            {...register("deliveryFee", { valueAsNumber: true })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-bold tabular-nums text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {/* Save to Menu Toggle */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
          <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              disabled={isFinalized}
              {...register("saveToMenu")}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>
              <strong className="block text-slate-900">
                Save verified prices back to restaurant menu
              </strong>
              <span className="text-slate-500">
                Updates the catalog so future orders start with these verified prices.
              </span>
            </span>
          </label>
        </div>

        {/* Approval Submit Button */}
        <div className="space-y-2 pt-1">
          <Button
            fullWidth
            size="lg"
            type="button"
            onClick={onSubmit}
            disabled={
              submitting ||
              itemsCount === 0 ||
              isFinalized ||
              !Number.isFinite(roomId)
            }
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 shadow-sm cursor-pointer"
          >
            <span className="inline-flex items-center gap-2">
              <FiCheckCircle size={16} />
              {submitting ? "Approving room…" : "Approve & finalize room"}
            </span>
          </Button>

          <Link href={`/admin/rooms/${roomId}/summary`} className="block">
            <Button fullWidth variant="ghost" size="sm" className="text-slate-600 cursor-pointer min-h-[38px] sm:min-h-[36px]">
              Cancel &amp; return to summary
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

