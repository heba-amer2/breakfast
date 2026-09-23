"use client";

import { useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { MyOrdersTable } from "@/components/orders/my-orders-table";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { fetchMyRooms } from "@/features/rooms/store/roomThunks";
import type { RoomStatus } from "@/features/rooms/store/roomSlice";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";

type StatusFilter = "ALL" | RoomStatus;

export default function MyOrdersScreen() {
  const dispatch = useAppDispatch();
  const myRooms = useAppSelector((state) => state.rooms.myRooms);
  const error = useAppSelector((state) => state.rooms.error);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  useAuthFetch(async () => {
    setLoading(true);
    await dispatch(fetchMyRooms());
    setLoading(false);
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return myRooms
      .filter((room) => {
        if (statusFilter !== "ALL" && room.status !== statusFilter) {
          return false;
        }

        if (!query) return true;

        return (
          room.restaurantName.toLowerCase().includes(query) ||
          (room.description ?? "").toLowerCase().includes(query) ||
          (room.status ?? "").toLowerCase().includes(query)
        );
      })
      .slice()
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [myRooms, search, statusFilter]);

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "ALL", label: "All Orders" },
    { key: "OPEN", label: "Open Now" },
    { key: "CLOSED", label: "Closed" },
    { key: "PENDING_ADMIN_APPROVAL", label: "Pending Split" },
    { key: "APPROVED_AND_CLOSED", label: "Finalized" },
  ];

  return (
    <>
      <TopBar
        title="My Orders & Bills"
        subtitle="Rooms you ordered in, along with individual bill splits and delivery records."
        tag="Order History"
      />

      <PageContainer className="space-y-6 pb-12">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => {
            const active = statusFilter === filter.key;
            const count =
              filter.key === "ALL"
                ? myRooms.length
                : myRooms.filter((room) => room.status === filter.key).length;

            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer select-none ${
                  active
                    ? "bg-emerald-700 text-white shadow-xs font-bold"
                    : "bg-white text-slate-600 border border-slate-200/90 hover:bg-emerald-50/50 hover:text-emerald-900 hover:border-emerald-200 shadow-2xs"
                }`}
              >
                <span>{filter.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] tabular-nums font-bold ${
                    active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {loading ? "—" : count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Orders Table Container */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/40">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Filter results:
              </span>
              <span className="font-bold text-slate-800">
                {filtered.length} {filtered.length === 1 ? "room order" : "room orders"}
              </span>
            </div>

            <div className="relative min-w-[220px]">
              <FiSearch
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search orders or restaurant…"
                className="h-9.5 w-full rounded-xl border border-slate-200/90 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <MyOrdersTable rooms={filtered} loading={loading} />
        </div>
      </PageContainer>
    </>
  );
}
