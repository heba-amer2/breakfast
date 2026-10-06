"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FiPlusCircle, FiRefreshCw } from "react-icons/fi";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button, EmptyState } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchPendingRooms,
  fetchUnapprovedRooms,
} from "@/features/admin/store/adminThunks";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import { formatMoney } from "@/lib/formatters";
import {
  matchesRoomSearch,
  roomTime,
} from "../utils/approvalQueueSearch";
import { ApprovalQueueStats } from "../components/ApprovalQueueStats";
import {
  ApprovalQueueTabs,
  type QueueTab,
} from "../components/ApprovalQueueTabs";
import {
  ApprovalQueueSearchBar,
  type SortKey,
} from "../components/ApprovalQueueSearchBar";
import { ApprovalQueueRoomCard } from "../components/ApprovalQueueRoomCard";

export default function ApprovalQueueScreen() {
  const dispatch = useAppDispatch();
  const unapproved = useAppSelector((state) => state.admin.unapprovedRooms);
  const pending = useAppSelector((state) => state.admin.pendingRooms);
  const error = useAppSelector((state) => state.admin.error);

  const [activeTab, setActiveTab] = useState<QueueTab>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab")?.toLowerCase();
      const stageParam = params.get("stage")?.toLowerCase();
      if (tabParam === "approval" || stageParam === "approval") return "approval";
      if (tabParam === "receipt" || stageParam === "receipt") return "receipt";
    }
    return "receipt";
  });

  const [search, setSearch] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("search") || params.get("q") || "";
    }
    return "";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab")?.toLowerCase();
    const stageParam = params.get("stage")?.toLowerCase();
    const searchParam = params.get("search") || params.get("q");

    if (tabParam === "approval" || stageParam === "approval") {
      setActiveTab("approval");
    } else if (tabParam === "receipt" || stageParam === "receipt" || tabParam === "closed") {
      setActiveTab("receipt");
    }

    if (searchParam) {
      setSearch(searchParam);
    }
  }, []);

  const [sortKey, setSortKey] = useState<SortKey>("oldest");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useAuthFetch(
    async () => {
      setLoading(true);

      const results = await Promise.all([
        dispatch(fetchUnapprovedRooms()),
        dispatch(fetchPendingRooms()),
      ]);

      setLoading(false);

      const everythingFailed = results.every(
        (result) => result.meta.requestStatus === "rejected",
      );

      if (!everythingFailed) {
        setLastUpdated(
          new Date().toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
      }
    },
    [refreshKey],
  );

  const queueTotal = unapproved.length + pending.length;

  const awaitingValue = useMemo(
    () =>
      pending.reduce((sum, room) => sum + (Number(room.receiptTotal) || 0), 0),
    [pending],
  );

  // Filtered lists for the two tabs
  const filteredUnapproved = useMemo(
    () => unapproved.filter((room) => matchesRoomSearch(room, search)),
    [unapproved, search],
  );

  const filteredPending = useMemo(
    () => pending.filter((room) => matchesRoomSearch(room, search)),
    [pending, search],
  );

  const hasSearch = Boolean(search.trim());

  // Active list sorted
  const displayedList = useMemo(() => {
    const base = activeTab === "receipt" ? filteredUnapproved : filteredPending;
    return [...base].sort((a, b) => {
      if (sortKey === "name") {
        return a.restaurantName.localeCompare(b.restaurantName);
      }
      if (sortKey === "value") {
        return (Number(b.receiptTotal) || 0) - (Number(a.receiptTotal) || 0);
      }
      const aTime = roomTime(a);
      const bTime = roomTime(b);
      return sortKey === "newest" ? bTime - aTime : aTime - bTime;
    });
  }, [activeTab, filteredUnapproved, filteredPending, sortKey]);

  const handleTabChange = (tab: QueueTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("stage", tab);
      url.searchParams.set("tab", "closed");
      window.history.replaceState(null, "", url.toString());
    }
  };

  const sorts: { key: SortKey; label: string }[] = [
    { key: "oldest", label: "Longest waiting" },
    { key: "newest", label: "Newest first" },
    { key: "value", label: "Highest value" },
    { key: "name", label: "Restaurant A–Z" },
  ];

  return (
    <>
      <TopBar
        title="Approval & Receipt Queue"
        subtitle="Closed rooms requiring paper receipt entry or final bill split approval."
        tag="ADMIN OPS"
        badge={
          queueTotal > 0 ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
              {queueTotal} in queue
            </span>
          ) : undefined
        }
        actions={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={loading}
              className="flex-1 sm:flex-none min-h-[38px] sm:min-h-[36px]"
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Refresh
              </span>
            </Button>

            <Link href="/admin/open-new-room" className="flex-1 sm:flex-none">
              <Button size="sm" className="w-full sm:w-auto min-h-[38px] sm:min-h-[36px]">
                <span className="inline-flex items-center justify-center gap-1.5">
                  <FiPlusCircle size={14} />
                  Open room
                </span>
              </Button>
            </Link>
          </div>
        }
      />

      <PageContainer className="space-y-4 sm:space-y-6 pb-12">
        {/* Stage Tabs & Workflow Banner */}
        <ApprovalQueueTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          loading={loading}
          hasSearch={hasSearch}
          filteredUnapprovedCount={filteredUnapproved.length}
          unapprovedCount={unapproved.length}
          filteredPendingCount={filteredPending.length}
          pendingCount={pending.length}
        />

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-sm">
            {error}
          </div>
        )}

        {/* Metric Cards Overview (Desktop & Tablet) */}
        <ApprovalQueueStats
          loading={loading}
          unapprovedCount={unapproved.length}
          pendingCount={pending.length}
          queueTotal={queueTotal}
          awaitingValue={awaitingValue}
        />

        {/* Room List Section */}
        <div className="mt-4 sm:mt-6 overflow-hidden rounded-[30px] border border-slate-200 bg-slate-50/60 shadow-sm">
          <ApprovalQueueSearchBar
            activeTab={activeTab}
            displayedCount={displayedList.length}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            sortKey={sortKey}
            onSortKeyChange={setSortKey}
            sorts={sorts}
          />

          <div className="p-3 sm:p-4">
            {loading ? (
              <ul className="space-y-3">
                <li>
                  <Skeleton className="h-28 w-full rounded-2xl" />
                </li>
                <li>
                  <Skeleton className="h-28 w-full rounded-2xl" />
                </li>
              </ul>
            ) : displayedList.length === 0 ? (
              <div className="p-4">
                {search.trim() ? (
                  (activeTab === "receipt" ? filteredPending.length > 0 : filteredUnapproved.length > 0) ? (
                    <EmptyState
                      title={`No rooms in this tab match "${search.trim()}"`}
                      description={`Found ${
                        activeTab === "receipt" ? filteredPending.length : filteredUnapproved.length
                      } matching room${
                        (activeTab === "receipt" ? filteredPending.length : filteredUnapproved.length) === 1 ? "" : "s"
                      } in ${activeTab === "receipt" ? "Need Approval" : "Need Receipt"}.`}
                      action={
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleTabChange(activeTab === "receipt" ? "approval" : "receipt")}
                          >
                            Switch to {activeTab === "receipt" ? "Need Approval" : "Need Receipt"}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setSearch("")}>
                            Clear search
                          </Button>
                        </div>
                      }
                    />
                  ) : (
                    <EmptyState
                      title={`No rooms match "${search.trim()}"`}
                      description="Try searching by room ID (e.g. #33), restaurant name, or host."
                      action={
                        <Button size="sm" variant="secondary" onClick={() => setSearch("")}>
                          Clear search
                        </Button>
                      }
                    />
                  )
                ) : (
                  <EmptyState
                    title={
                      activeTab === "receipt"
                        ? "Nothing is waiting for a receipt"
                        : "Nothing is waiting for approval"
                    }
                    description={
                      activeTab === "receipt"
                        ? "Every closed room has its receipt entered. Rooms appear here as soon as they are closed."
                        : "Once you save a paper receipt, the room moves here for final review and approval."
                    }
                    action={
                      <Link href="/admin/open-new-room">
                        <Button size="sm" variant="secondary">
                          Open a new room
                        </Button>
                      </Link>
                    }
                  />
                )}
              </div>
            ) : (
              <ul className="space-y-3">
                {displayedList.map((room, index) => (
                  <ApprovalQueueRoomCard
                    key={room.id}
                    room={room}
                    index={index}
                    activeTab={activeTab}
                  />
                ))}
              </ul>
            )}
          </div>

          {!loading && displayedList.length > 0 ? (
            <div className="flex flex-col gap-2 border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {activeTab === "approval"
                  ? "Approving a room finalizes the session and saves verified prices to the restaurant catalog."
                  : "Enter each receipt to compute the participant split and move rooms to final approval."}
              </span>

              {activeTab === "approval" && awaitingValue > 0 ? (
                <span className="font-medium tabular-nums text-slate-700">
                  {formatMoney(awaitingValue)} awaiting approval
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </PageContainer>
    </>
  );
}