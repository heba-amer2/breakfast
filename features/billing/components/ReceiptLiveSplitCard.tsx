"use client";

import Link from "next/link";
import {
  FiArrowRight,
  FiCheckCircle,
  FiInfo,
  FiRefreshCw,
  FiSave,
} from "react-icons/fi";

import { Button, StatusChip } from "@/components/ui";
import type { BillResponse, ReceiptDraftResponse } from "@/features/billing/store/billingSlice";
import type { ReceiptParticipant } from "@/features/billing/hooks/useReceiptEntry";
import { formatMoney } from "@/lib/formatters";

type ReceiptLiveSplitCardProps = {
  bill: BillResponse | null;
  foodSubtotal: number;
  deliveryFee: number;
  participantCount: number;
  summaryParticipantCount?: number;
  receiptTotal: number;
  previewing: boolean;
  handlePreview: () => void;
  roomId: number;
  itemsCount: number;
  participants: ReceiptParticipant[];
  isFinalized: boolean;
  submitting: boolean;
  handleSubmit: () => void;
  receiptDraft: ReceiptDraftResponse | null;
};

export function ReceiptLiveSplitCard({
  bill,
  foodSubtotal,
  deliveryFee,
  participantCount,
  summaryParticipantCount,
  receiptTotal,
  previewing,
  handlePreview,
  roomId,
  itemsCount,
  participants,
  isFinalized,
  submitting,
  handleSubmit,
  receiptDraft,
}: ReceiptLiveSplitCardProps) {
  return (
    <div className="space-y-6">
      {/* Live Split Preview Card */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Live Split Preview
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Food is charged to whoever ordered it; delivery is divided equally among people with orders.
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              bill?.pricesVerified
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {bill?.pricesVerified ? "Verified" : "Draft preview"}
          </span>
        </div>

        {/* Live Figures */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
            <span>Food total</span>
            <span className="font-bold tabular-nums text-slate-900">
              {formatMoney(bill ? bill.totalFoodCost : foodSubtotal)}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
            <span>Delivery share / person</span>
            <span className="font-bold tabular-nums text-slate-900">
              {formatMoney(
                bill
                  ? bill.deliverySharePerPerson
                  : participantCount > 0
                  ? deliveryFee / participantCount
                  : summaryParticipantCount
                  ? deliveryFee / summaryParticipantCount
                  : deliveryFee,
              )}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-emerald-900">
            <span className="font-bold">Grand total</span>
            <span className="text-base font-extrabold tabular-nums">
              {formatMoney(bill ? bill.grandTotal : receiptTotal)}
            </span>
          </div>
        </div>

        <Button
          fullWidth
          size="sm"
          variant="secondary"
          onClick={handlePreview}
          disabled={previewing || !Number.isFinite(roomId) || itemsCount === 0}
          className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 min-h-[38px] sm:min-h-[36px]"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold">
            <FiRefreshCw
              size={13}
              className={previewing ? "animate-spin" : ""}
            />
            {previewing ? "Previewing…" : "Refresh server split"}
          </span>
        </Button>

        {/* Participant Breakdown */}
        <div className="space-y-2 pt-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Participant Breakdown
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {bill?.breakdown && bill.breakdown.length > 0 ? (
              bill.breakdown.map((entry) => (
                <div
                  key={entry.userId}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs space-y-1"
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
              ))
            ) : participants.length > 0 ? (
              participants.map((p) => {
                const estimatedDeliveryShare =
                  participants.length > 0
                    ? deliveryFee / participants.length
                    : 0;
                return (
                  <div
                    key={p.userId}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span className="truncate">{p.name}</span>
                      <span className="tabular-nums text-slate-900">
                        {formatMoney(p.subtotal + estimatedDeliveryShare)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{p.lines.length} {p.lines.length === 1 ? "item" : "items"}</span>
                      <span>Est. delivery: {formatMoney(estimatedDeliveryShare)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-400 italic text-center">
                No participants yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Primary Action Card */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Finalize &amp; Submit
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Saves the receipt prices, computes the participant split, and moves the room into the pending approval workflow.
          </p>
        </div>

        {isFinalized ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 flex items-start gap-2">
            <FiInfo size={14} className="mt-0.5 shrink-0 text-slate-400" />
            <span>This room is already approved and closed. The receipt cannot be changed.</span>
          </div>
        ) : null}

        <div className="space-y-2.5 pt-1">
          <Button
            fullWidth
            size="lg"
            onClick={handleSubmit}
            disabled={
              submitting ||
              itemsCount === 0 ||
              isFinalized ||
              !Number.isFinite(roomId)
            }
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            <span className="inline-flex items-center gap-2">
              <FiSave size={16} />
              {submitting ? "Saving receipt…" : "Save receipt & split bill"}
            </span>
          </Button>

          {itemsCount === 0 ? (
            <p className="text-[11px] text-amber-700 text-center font-medium leading-relaxed bg-amber-50 rounded-xl p-2 border border-amber-200/60">
              Cannot save receipt: No participant orders exist in this room.
            </p>
          ) : null}

          <Link
            href={`/admin/rooms/${Number.isFinite(roomId) ? roomId : ""}/approval`}
            className="block"
          >
            <Button fullWidth variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 cursor-pointer min-h-[38px] sm:min-h-[36px]">
              <span className="inline-flex items-center gap-1.5">
                Continue to approval
                <FiArrowRight size={14} />
              </span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Saved Receipt Draft Feedback */}
      {receiptDraft ? (
        <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-emerald-700" size={16} />
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Receipt Saved on Server
              </h4>
            </div>
            {receiptDraft.status ? <StatusChip status={receiptDraft.status} /> : null}
          </div>

          <div className="space-y-1.5 text-xs text-emerald-950">
            <div className="flex items-center justify-between rounded-lg bg-white/70 px-2.5 py-1.5">
              <span>Grand total</span>
              <strong className="tabular-nums">{formatMoney(receiptDraft.bill?.grandTotal)}</strong>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/70 px-2.5 py-1.5">
              <span>Reconciliation delta</span>
              <strong className="tabular-nums">{formatMoney(receiptDraft.reconciliationDelta)}</strong>
            </div>
          </div>

          <Link href={`/admin/rooms/${roomId}/approval`} className="block pt-1">
            <Button fullWidth variant="secondary" size="sm" className="border-emerald-300 text-emerald-900 bg-white hover:bg-emerald-100 cursor-pointer">
              <span className="inline-flex items-center gap-1.5 font-bold">
                Go to approval
                <FiArrowRight size={13} />
              </span>
            </Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

