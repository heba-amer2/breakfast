"use client";

import { FiSearch, FiX } from "react-icons/fi";
import type { QueueTab } from "./ApprovalQueueTabs";

export type SortKey = "oldest" | "newest" | "value" | "name";

type ApprovalQueueSearchBarProps = {
  activeTab: QueueTab;
  displayedCount: number;
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  sortKey: SortKey;
  onSortKeyChange: (value: SortKey) => void;
  sorts: { key: SortKey; label: string }[];
};

export function ApprovalQueueSearchBar({
  activeTab,
  displayedCount,
  loading,
  search,
  onSearchChange,
  sortKey,
  onSortKeyChange,
  sorts,
}: ApprovalQueueSearchBarProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 bg-white p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          {activeTab === "receipt"
            ? "Stage 1 · Need Receipt"
            : "Stage 2 · Need Approval"}
        </p>

        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
          {loading
            ? "Loading rooms…"
            : `${displayedCount} ${
                activeTab === "receipt"
                  ? "room awaiting receipt"
                  : "room awaiting approval"
              }${displayedCount === 1 ? "" : "s"}`}
          {!loading && search.trim() ? " matching search" : ""}
        </h2>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full lg:w-auto">
        {/* Search input */}
        <div className="relative w-full sm:w-72 xl:w-80">
          <FiSearch
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name, ID, host…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              title="Clear search"
              aria-label="Clear search"
            >
              <FiX size={14} />
            </button>
          ) : null}
        </div>

        {/* Sort dropdown */}
        <select
          value={sortKey}
          onChange={(event) => onSortKeyChange(event.target.value as SortKey)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 cursor-pointer"
        >
          {sorts.map((sort) => (
            <option key={sort.key} value={sort.key}>
              {sort.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

