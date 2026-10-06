"use client";

import { FiCheckSquare, FiFileText } from "react-icons/fi";

export type QueueTab = "receipt" | "approval";

type ApprovalQueueTabsProps = {
  activeTab: QueueTab;
  onTabChange: (tab: QueueTab) => void;
  loading: boolean;
  hasSearch: boolean;
  filteredUnapprovedCount: number;
  unapprovedCount: number;
  filteredPendingCount: number;
  pendingCount: number;
};

export function ApprovalQueueTabs({
  activeTab,
  onTabChange,
  loading,
  hasSearch,
  filteredUnapprovedCount,
  unapprovedCount,
  filteredPendingCount,
  pendingCount,
}: ApprovalQueueTabsProps) {
  return (
    <>
      {/* Stage Tabs Switcher */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 sm:p-2">
        <button
          type="button"
          onClick={() => onTabChange("receipt")}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer min-h-[44px] ${
            activeTab === "receipt"
              ? "bg-white text-emerald-950 shadow-xs ring-1 ring-emerald-500/20"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FiFileText
            size={16}
            className={activeTab === "receipt" ? "text-emerald-700" : "text-slate-400"}
          />
          <span className="truncate">Need Receipt</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
              activeTab === "receipt"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {loading ? "—" : hasSearch ? filteredUnapprovedCount : unapprovedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("approval")}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer min-h-[44px] ${
            activeTab === "approval"
              ? "bg-white text-emerald-950 shadow-xs ring-1 ring-emerald-500/20"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FiCheckSquare
            size={16}
            className={activeTab === "approval" ? "text-emerald-700" : "text-slate-400"}
          />
          <span className="truncate">Need Approval</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
              activeTab === "approval"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {loading ? "—" : hasSearch ? filteredPendingCount : pendingCount}
          </span>
        </button>
      </div>

      {/* Tab Helper Banner */}
      {activeTab === "receipt" ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200/80">
              1
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Stage 1 · Paper Receipt Entry
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                These closed rooms need their actual physical restaurant receipt entered. Enter item prices and delivery to calculate each participant&apos;s share.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200/80">
              2
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Stage 2 · Review &amp; Bill Approval
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Receipts are recorded and participant bill splits are calculated. Review individual costs and approve the room to finalize charges.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

