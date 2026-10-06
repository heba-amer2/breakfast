"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
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

function useUrlSearch(): string {
  return useSyncExternalStore(
    (notify) => {
      window.addEventListener("popstate", notify);
      return () => window.removeEventListener("popstate", notify);
    },
    () => (typeof window !== "undefined" ? window.location.search : ""),
    () => ""
  );
}

const sorts: { key: SortKey; label: string }[] = [
  { key: "oldest", label: "Oldest First" },
  { key: "newest", label: "Newest First" },
  { key: "name", label: "Restaurant Name" },
  { key: "value", label: "Estimated / Bill Total" },
];

export default function ApprovalQueueScreen() {
  const dispatch = useAppDispatch();
  const unapproved = useAppSelector((state) => state.admin.unapprovedRooms);
  const pending = useAppSelector((state) => state.admin.pendingRooms);
  const error = useAppSelector((state) => state.admin.error);

  const urlSearch = useUrlSearch();

  const urlTab = useMemo<QueueTab>(() => {
    const params = new URLSearchParams(urlSearch);
    const tabParam = params.get("tab")?.toLowerCase();
    const stageParam = params.get("stage")?.toLowerCase();
    if (tabParam === "approval" || stageParam === "approval") return "approval";
    return "receipt";
  }, [urlSearch]);

  const urlSearchText = useMemo<string>(() => {
    const params = new URLSearchParams(urlSearch);
    return params.get("search") || params.get("q") || "";
  }, [urlSearch]);

  const [tabOverride, setTabOverride] = useState<QueueTab | null>(null);
  const [searchOverride, setSearchOverride] = useState<string | null>(null);

  const activeTab = tabOverride ?? urlTab;
  const setActiveTab = (tab: QueueTab) => setTabOverride(tab);

  const search = searchOverride ?? urlSearchText;
  const setSearch = (text: string) => setSearchOverride(text);

  const [sortKey, setSortKey] = useState<SortKey>("oldest");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useAuthFetch(
    async () => {
      setLoading(true);

      await Promise.all([
        dispatch(fetchUnapprovedRooms()),
        dispatch(fetchPendingRooms()),
      ]);

      setLoading(false);
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

  // Active list based on activeTab
  const activeList = useMemo(() => {
    const source =
      activeTab === "receipt" ? filteredUnapproved : filteredPending;

    return [...source].sort((a, b) => {
      if (sortKey === "oldest") return roomTime(a) - roomTime(b);
      if (sortKey === "newest") return roomTime(b) - roomTime(a);
      if (sortKey === "name") {
        return (a.restaurantName || "").localeCompare(b.restaurantName || "");
      }
      if (sortKey === "value") {
        return (Number(b.receiptTotal) || 0) - (Number(a.receiptTotal) || 0);
      }
      return 0;
    });
  }, [activeTab, filteredUnapproved, filteredPending, sortKey]);

  return (
    <>
      <TopBar
        title="Order Processing Queue"
        subtitle="Manage closed rooms needing paper receipt entry or final bill split authorization."
        tag="ADMIN OPS"
        badge={queueTotal > 0 ? `${queueTotal} Actionable` : undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loading}
              className="flex-1 sm:flex-none min-h-[38px] sm:min-h-[36px]"
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <FiRefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh Queue
              </span>
            </Button>
            <Link href="/admin/open-room" className="flex-1 sm:flex-none">
              <Button size="sm" className="w-full sm:w-auto min-h-[38px] sm:min-h-[36px]">
                <span className="inline-flex items-center justify-center gap-1.5">
                  <FiPlusCircle size={14} />
                  Open New Room
                </span>
              </Button>
            </Link>
          </div>
        }
      />

      <PageContainer className="space-y-4 sm:space-y-6 pb-8 sm:pb-12">
        {/* Error Alert */}
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800 shadow-sm">
            {error}
          </div>
        ) : null}

        {/* 3 Metric Cards */}
        <ApprovalQueueStats
          loading={loading}
          unapprovedCount={unapproved.length}
          pendingCount={pending.length}
          queueTotal={queueTotal}
          awaitingValue={awaitingValue}
        />

        {/* Pipeline Tab Switcher */}
        <ApprovalQueueTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          loading={loading}
          hasSearch={Boolean(search.trim())}
          filteredUnapprovedCount={filteredUnapproved.length}
          unapprovedCount={unapproved.length}
          filteredPendingCount={filteredPending.length}
          pendingCount={pending.length}
        />

        {/* Search, Filter & View Controls */}
        <ApprovalQueueSearchBar
          activeTab={activeTab}
          displayedCount={activeList.length}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          sortKey={sortKey}
          onSortKeyChange={setSortKey}
          sorts={sorts}
        />

        {/* Main Worklist Display */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-1/2 rounded-md" />
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <Skeleton className="h-10 flex-1 rounded-xl" />
                  <Skeleton className="h-10 w-24 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : activeList.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <EmptyState
              title={
                search
                  ? "No matching rooms in this queue"
                  : activeTab === "receipt"
                  ? "No rooms waiting for receipt entry"
                  : "No rooms waiting for approval"
              }
              description={
                search
                  ? `No rooms matched "${search}". Try searching by room ID (#33) or a different name.`
                  : activeTab === "receipt"
                  ? "All closed rooms have their paper receipts entered. Great job!"
                  : "No rooms currently require bill split authorization."
              }
              action={
                search ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSearch("")}
                  >
                    Clear Search Filter
                  </Button>
                ) : (
                  <Link href="/admin/open-room">
                    <Button size="sm">Open a Breakfast Room</Button>
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {activeList.map((room, index) => (
              <ApprovalQueueRoomCard
                key={room.id}
                room={room}
                index={index}
                activeTab={activeTab}
              />
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
