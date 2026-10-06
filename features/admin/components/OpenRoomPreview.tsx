"use client";

import { FiCheckCircle } from "react-icons/fi";
import { LuUtensils } from "react-icons/lu";

import { Button } from "@/components/ui";

type OpenRoomPreviewProps = {
  previewName: string;
  description?: string;
  mode: "existing" | "new";
  fieldsCount: number;
  isSubmitting: boolean;
};

export function OpenRoomPreview({
  previewName,
  description,
  mode,
  fieldsCount,
  isSubmitting,
}: OpenRoomPreviewProps) {
  return (
    <aside className="hidden lg:block rounded-[28px] border border-slate-200 bg-slate-50 p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <LuUtensils size={18} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Preview
          </p>
          <h3 className="text-base font-semibold text-slate-900">
            Room overview
          </h3>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          Restaurant
        </p>
        <p className="mt-2 text-xl font-bold text-slate-900">
          {previewName}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          {description?.trim() || "No extra notes added yet."}
        </p>
      </div>

      <div className="mt-4 space-y-3 text-sm text-slate-600">
        <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2.5 shadow-sm">
          <span>Room status</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
            <FiCheckCircle size={12} />
            Ready
          </span>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2.5 shadow-sm">
          <span>Duration</span>
          <span className="font-medium text-slate-900">60 min</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2.5 shadow-sm">
          <span>Order access</span>
          <span className="font-medium text-slate-900">Live</span>
        </div>
        {mode === "new" && fieldsCount > 0 ? (
          <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2.5 shadow-sm">
            <span>Starting dishes</span>
            <span className="font-bold text-emerald-800">
              {fieldsCount} {fieldsCount === 1 ? "item" : "items"}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-5">
        <Button
          fullWidth
          size="lg"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? mode === "new"
              ? "Creating & Opening…"
              : "Opening…"
            : mode === "new"
              ? "Create Restaurant & Open Room"
              : "Open breakfast room"}
        </Button>
      </div>
    </aside>
  );
}

