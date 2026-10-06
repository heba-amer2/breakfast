"use client";

import type { UseFormRegister } from "react-hook-form";
import { FiFileText, FiTruck } from "react-icons/fi";

import { formatMoney } from "@/lib/formatters";

type ReceiptTotalsFormValues = {
  deliveryFee: number;
  receiptTotal: string;
};

type ReceiptTotalsCardProps = {
  register: UseFormRegister<ReceiptTotalsFormValues>;
  isFinalized: boolean;
  foodSubtotal: number;
  deliveryFee: number;
  computedTotal: number;
};

export function ReceiptTotalsCard({
  register,
  isFinalized,
  foodSubtotal,
  deliveryFee,
  computedTotal,
}: ReceiptTotalsCardProps) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-900">
          Receipt totals
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Specify the delivery fee and the printed total written on the paper receipt.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4">
          <label
            htmlFor="delivery-fee-field"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            <FiTruck size={14} className="text-slate-400" />
            Delivery fee
          </label>
          <div className="relative flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
            <span className="text-xs font-bold text-slate-400 mr-2">
              EGP
            </span>
            <input
              id="delivery-fee-field"
              type="number"
              min="0"
              max="10000"
              step="0.01"
              disabled={isFinalized}
              {...register("deliveryFee", { valueAsNumber: true })}
              className="w-full bg-transparent text-base font-bold tabular-nums text-slate-900 outline-none disabled:cursor-not-allowed disabled:text-slate-400"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            Divided equally among all active participants.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4">
          <label
            htmlFor="receipt-total-field"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            <FiFileText size={14} className="text-slate-400" />
            Printed receipt total
          </label>
          <div className="relative flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
            <span className="text-xs font-bold text-slate-400 mr-2">
              EGP
            </span>
            <input
              id="receipt-total-field"
              type="number"
              min="0"
              max="1000000"
              step="0.01"
              disabled={isFinalized}
              placeholder={computedTotal.toFixed(2)}
              {...register("receiptTotal")}
              className="w-full bg-transparent text-base font-bold tabular-nums text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            The total written on the paper receipt.
          </p>
        </div>
      </div>

      {/* Summary Comparison */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-xs text-slate-600">
        <div className="flex items-center justify-between py-1">
          <span>Food subtotal (sum of items):</span>
          <strong className="text-slate-800 tabular-nums">{formatMoney(foodSubtotal)}</strong>
        </div>
        <div className="flex items-center justify-between py-1">
          <span>Delivery fee:</span>
          <strong className="text-slate-800 tabular-nums">{formatMoney(deliveryFee)}</strong>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5 mt-1 font-semibold">
          <span className="text-slate-800">Expected computed total:</span>
          <strong className="text-slate-900 tabular-nums">{formatMoney(computedTotal)}</strong>
        </div>
      </div>
    </div>
  );
}

