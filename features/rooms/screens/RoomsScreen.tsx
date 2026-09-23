"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiClock,
  FiCoffee,
  FiGrid,
  FiList,
  FiSearch,
} from "react-icons/fi";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { RoomCard } from "@/components/rooms/room-card";
import { RoomsTable } from "@/components/rooms/rooms-table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip } from "@/components/ui/status-chip";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { fetchRooms } from "@/features/rooms/store/roomThunks";
import type { RoomStatus } from "@/features/rooms/store/roomSlice";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import { useActiveRoomsTracker } from "@/features/rooms/hooks/useActiveRoomsTracker";

type RoomTab = "OPEN" | "CLOSED";
type SortKey = "newest" | "name" | "countdown";

const statusCardConfig: {
  status: RoomStatus;
  label: string;
  tab: RoomTab;
}[] = [
  { status: "OPEN", label: "Open Now", tab: "OPEN" },
  { status: "PENDING_ADMIN_APPROVAL", label: "Pending Split", tab: "CLOSED" },
  { status: "APPROVED_AND_CLOSED", label: "Finalized", tab: "CLOSED" },
  { status: "CLOSED", label: "Closed", tab: "CLOSED" },
];

export default function RoomsScreen() {
  const dispatch = useAppDispatch();
  const rooms = useAppSelector((state) => state.rooms.items);
  const error = useAppSelector((state) => state.rooms.error);

  const [currentTab, setCurrentTab] = useState<RoomTab>("OPEN");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [loading, setLoading] = useState(true);

  useAuthFetch(async () => {
    setLoading(true);
    await dispatch(fetchRooms(undefined));
    setLoading(false);
  });

  const { activeRooms, activeCount, closedRooms, closedCount } =
    useActiveRoomsTracker(rooms);

  const sourceRooms = currentTab === "OPEN" ? activeRooms : closedRooms;

  const filteredRooms = useMemo(() => {
    const query = search.trim().toLowerCase();

    let list = sourceRooms.filter((room) => {
      if (!query) return true;

      return (
        room.restaurantName.toLowerCase().includes(query) ||
        (room.description ?? "").toLowerCase().includes(query) ||
        (room.createdByName ?? "").toLowerCase().includes(query) ||
        (room.status ?? "").toLowerCase().includes(query)
      );
    });

    list = [...list].sort((a, b) => {
      if (sortKey === "name") {
        return a.restaurantName.localeCompare(b.restaurantName);
      }

      if (sortKey === "countdown") {
        const aSec =
          typeof a.secondsRemaining === "number"
            ? a.secondsRemaining
            : Number.MAX_SAFE_INTEGER;
        const bSec =
          typeof b.secondsRemaining === "number"
            ? b.secondsRemaining
            : Number.MAX_SAFE_INTEGER;
        return aSec - bSec;
      }

      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    return list;
  }, [sourceRooms, search, sortKey]);

  return (
    <>
      <TopBar
        title="Breakfast Rooms"
        subtitle="Browse active office rooms, join with your colleagues, and add your breakfast dishes."
        tag="Ordering Portal"
      />

      <PageContainer className="space-y-6">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {/* Tab Switcher & View Mode Toggle */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Main Tabs: Open Rooms vs Closed Rooms */}
          <div className="inline-flex rounded-2xl border border-slate-200/90 bg-slate-100/80 p-1.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setCurrentTab("OPEN")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer select-none ${
                currentTab === "OPEN"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <FiCoffee size={15} />
              <span>Open Rooms</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                  currentTab === "OPEN"
                    ? "bg-emerald-700 text-emerald-50"
                    : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {loading ? "—" : activeCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab("CLOSED")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer select-none ${
                currentTab === "CLOSED"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <FiClock size={15} />
              <span>Closed Rooms</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                  currentTab === "CLOSED"
                    ? "bg-emerald-700 text-emerald-50"
                    : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {loading ? "—" : closedCount}
              </span>
            </button>
          </div>

          {/* Right: View Mode Toggle */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs font-medium text-slate-400 mr-1">View:</span>
            <div className="inline-flex rounded-xl border border-slate-200/80 bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                aria-label="Cards view"
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-emerald-50 text-emerald-800 font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <FiGrid size={13} />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                aria-label="Table view"
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  viewMode === "table"
                    ? "bg-emerald-50 text-emerald-800 font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <FiList size={13} />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status KPI Cards */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {statusCardConfig.map((item) => {
            const count =
              item.status === "OPEN"
                ? activeCount
                : rooms.filter((room) => room.status === item.status).length;
            const isTabActive = currentTab === item.tab;

            return (
              <button
                key={item.status}
                type="button"
                onClick={() => setCurrentTab(item.tab)}
                className={`rounded-2xl border p-4 text-left transition-all duration-150 cursor-pointer food-card-hover ${
                  isTabActive && item.status === "OPEN"
                    ? "border-emerald-300/90 bg-linear-to-br from-white to-emerald-50/50 shadow-xs ring-1 ring-emerald-300/60"
                    : "border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {item.label}
                  </p>
                  <StatusChip status={item.status} size="sm" />
                </div>
                <p className="mt-2 text-2xl font-extrabold tabular-nums text-slate-900">
                  {loading ? "—" : count}
                </p>
              </button>
            );
          })}
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <FiSearch
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search in ${currentTab === "OPEN" ? "open" : "closed"} rooms…`}
              className="h-10 w-full rounded-xl border border-slate-200/90 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="text-xs font-medium text-slate-500">
              Showing {filteredRooms.length} of {sourceRooms.length}
            </span>

            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              aria-label="Sort rooms by"
              className="h-10 rounded-xl border border-slate-200/90 bg-slate-50/50 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="name">Restaurant A–Z</option>
              {currentTab === "OPEN" ? (
                <option value="countdown">Ending Soonest</option>
              ) : null}
            </select>
          </div>
        </div>

        {/* Room List Presentation */}
        {loading ? (
          viewMode === "cards" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-44 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          )
        ) : filteredRooms.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-xs">
            <EmptyState
              icon={
                search.trim() ? (
                  <FiSearch size={32} className="text-slate-400" />
                ) : currentTab === "OPEN" ? (
                  <FiCoffee size={32} className="text-emerald-600" />
                ) : (
                  <FiClock size={32} className="text-slate-400" />
                )
              }
              title={
                search.trim()
                  ? `No ${currentTab === "OPEN" ? "open" : "closed"} rooms match "${search}"`
                  : currentTab === "OPEN"
                    ? "No Open Breakfast Rooms"
                    : "No Closed Rooms"
              }
              description={
                search.trim()
                  ? "Try adjusting your search criteria or clear the search input."
                  : currentTab === "OPEN"
                    ? "There are currently no active breakfast rooms accepting orders. Check back soon or browse restaurants."
                    : "Breakfast rooms that have finished ordering or have finalized splits will appear here in the history."
              }
              action={
                search.trim() ? (
                  <Button variant="secondary" size="sm" onClick={() => setSearch("")}>
                    Clear search
                  </Button>
                ) : currentTab === "OPEN" ? (
                  <Link href="/user/restaurants">
                    <Button variant="secondary" size="sm">
                      Browse Restaurants
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : viewMode === "cards" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
            <RoomsTable
              rooms={filteredRooms}
              loading={false}
              emptyTitle={
                currentTab === "OPEN"
                  ? "No Open Breakfast Rooms"
                  : "No Closed Rooms"
              }
              emptyDescription={
                currentTab === "OPEN"
                  ? "There are currently no active breakfast rooms accepting orders."
                  : "No closed breakfast rooms found."
              }
            />
          </div>
        )}
      </PageContainer>
    </>
  );
}
