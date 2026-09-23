"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FiArrowRight,
  FiCheckSquare,
  FiClock,
  FiCoffee,
  FiDollarSign,
  FiFileText,
  FiPlusCircle,
  FiRefreshCw,
  FiSearch,
  FiTruck,
  FiUser,
} from "react-icons/fi";

import { StatCard } from "@/components/dashboard/stat-card";
import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button, EmptyState, StatusChip } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchPendingRooms,
  fetchUnapprovedRooms,
} from "@/features/admin/store/adminThunks";
import type { RoomResponse } from "@/features/rooms/store/roomSlice";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import { formatDateTime, formatMoney } from "@/lib/formatters";

type QueueKey = "receipt" | "approval";
type SortKey = "oldest" | "newest" | "value" | "name";

const stageBase = "flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left";

function roomTime(room: RoomResponse) {
  const value = room.finalizedAt ?? room.createdAt;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
}

function roomMoment(room: RoomResponse) {
  return room.finalizedAt ?? room.createdAt;
}

function QueueRow({
  room,
  index,
  showReceipt,
}: {
  room: RoomResponse;
  index: number;
  showReceipt: boolean;
}) {
  const actionHref = showReceipt
    ? `/admin/rooms/${room.id}/receipt`
    : `/admin/rooms/${room.id}/approval`;

  return (
    <li className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold tabular-nums text-slate-600">
            {index + 1}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-slate-900">
                {room.restaurantName}
              </h3>
              <StatusChip status={room.status} />
            </div>

            <p className="mt-1 line-clamp-1 text-sm text-slate-500">
              {room.description || "No description added for this room."}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <FiUser size={13} className="text-slate-400" />
                {room.createdByName ?? "Admin"}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <FiClock size={13} className="text-slate-400" />
                {showReceipt ? "Closed" : "Receipt saved"}{" "}
                {formatDateTime(roomMoment(room))}
              </span>

              {typeof room.menuItemCount === "number" ? (
                <span className="inline-flex items-center gap-1.5">
                  <FiCoffee size={13} className="text-slate-400" />
                  {room.menuItemCount} menu item
                  {room.menuItemCount === 1 ? "" : "s"}
                </span>
              ) : null}

              {typeof room.totalDeliveryFee === "number" &&
              room.totalDeliveryFee > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <FiTruck size={13} className="text-slate-400" />
                  {formatMoney(room.totalDeliveryFee)} delivery
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
          <div className="rounded-2xl bg-slate-50 px-4 py-2.5 text-left sm:text-right">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {showReceipt ? "Items to price" : "Receipt total"}
            </p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">
              {showReceipt
                ? (room.menuItemCount ?? "—")
                : formatMoney(room.receiptTotal)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/admin/rooms/${room.id}/summary`} className="flex-1">
              <Button fullWidth size="sm" variant="ghost">
                Summary
              </Button>
            </Link>

            <Link href={actionHref} className="flex-1">
              <Button fullWidth size="sm">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  {showReceipt ? "Enter receipt" : "Review & approve"}
                  <FiArrowRight size={14} />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}

export default function ApprovalQueueScreen() {
  const dispatch = useAppDispatch();
  const unapproved = useAppSelector((state) => state.admin.unapprovedRooms);
  const pending = useAppSelector((state) => state.admin.pendingRooms);
  const error = useAppSelector((state) => state.admin.error);

  const [tab, setTab] = useState<QueueKey>("receipt");
  const [search, setSearch] = useState("");
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

  const queue = tab === "receipt" ? unapproved : pending;

  const list = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = queue.filter(
      (room) =>
        !query ||
        room.restaurantName.toLowerCase().includes(query) ||
        (room.description ?? "").toLowerCase().includes(query) ||
        (room.createdByName ?? "").toLowerCase().includes(query),
    );

    return [...filtered].sort((a, b) => {
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
  }, [queue, search, sortKey]);

  const queueTotal = unapproved.length + pending.length;

  const awaitingValue = useMemo(
    () =>
      pending.reduce((sum, room) => sum + (Number(room.receiptTotal) || 0), 0),
    [pending],
  );

  const stages: {
    key: QueueKey;
    step: number;
    label: string;
    description: string;
    count: number;
    active: string;
    idle: string;
    badge: string;
  }[] = [
    {
      key: "receipt",
      step: 1,
      label: "Enter receipt",
      description: "Rooms closed and waiting for the real prices off the receipt.",
      count: unapproved.length,
      active: "border-emerald-300 bg-emerald-50/80 ring-1 ring-emerald-400",
      idle: "border-transparent bg-white",
      badge: "bg-emerald-600 text-white",
    },
    {
      key: "approval",
      step: 2,
      label: "Approve & close",
      description: "Receipts already entered, waiting for the final sign-off.",
      count: pending.length,
      active: "border-emerald-400 bg-emerald-100/60 ring-1 ring-emerald-500",
      idle: "border-transparent bg-white",
      badge: "bg-emerald-800 text-white",
    },
  ];

  const sorts: { key: SortKey; label: string }[] = [
    { key: "oldest", label: "Longest waiting" },
    { key: "newest", label: "Newest first" },
    { key: "value", label: "Highest value" },
    { key: "name", label: "Restaurant A–Z" },
  ];

  return (
    <>
      <TopBar
        title="Approval Queue"
        subtitle="Enter the receipt for closed rooms, then approve the final split."
        tag="ADMIN OPS"
        badge={queueTotal > 0 ? `${queueTotal} waiting` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={loading}
            >
              <span className="inline-flex items-center gap-1.5">
                <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Refresh
              </span>
            </Button>

            <Link href="/admin/open-new-room">
              <Button size="sm">
                <span className="inline-flex items-center gap-1.5">
                  <FiPlusCircle size={14} />
                  Open room
                </span>
              </Button>
            </Link>
          </div>
        }
      />

      <PageContainer className="pb-10">
        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mb-5 flex flex-col gap-2 rounded-[24px] border border-slate-200 bg-white p-2 shadow-sm sm:flex-row sm:items-stretch">
          {stages.map((stage, index) => (
            <div key={stage.key} className="flex flex-1 items-center gap-2">
              {index > 0 ? (
                <FiArrowRight
                  size={16}
                  className="hidden shrink-0 text-slate-300 sm:block"
                />
              ) : null}

              <button
                type="button"
                onClick={() => setTab(stage.key)}
                aria-pressed={tab === stage.key}
                className={`${stageBase} ${
                  tab === stage.key ? stage.active : stage.idle
                } border transition hover:border-slate-200`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    tab === stage.key ? stage.badge : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {stage.step}
                </span>

                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">
                      {stage.label}
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-600 ring-1 ring-slate-200">
                      {loading ? "—" : stage.count}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {stage.description}
                  </span>
                </span>
              </button>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Need receipt"
            value={loading ? "—" : unapproved.length}
            hint="Closed, no receipt entered"
            tone="sage"
            icon={<FiFileText size={18} />}
          />
          <StatCard
            label="Need approval"
            value={loading ? "—" : pending.length}
            hint="Receipt saved, awaiting sign-off"
            tone="forest"
            icon={<FiCheckSquare size={18} />}
          />
          <StatCard
            label="Value to approve"
            value={loading ? "—" : formatMoney(awaitingValue)}
            hint="Across rooms pending approval"
            tone="emerald"
            icon={<FiDollarSign size={18} />}
          />
          <StatCard
            label="In queue"
            value={loading ? "—" : queueTotal}
            hint={
              lastUpdated
                ? `Updated ${lastUpdated}`
                : "Rooms in the approval pipeline"
            }
            tone="default"
            icon={<FiClock size={18} />}
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-[30px] border border-slate-200 bg-slate-50/60 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 bg-white p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {tab === "receipt" ? "Stage 1 · Need receipt" : "Stage 2 · Need approval"}
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                {loading
                  ? "Loading queue…"
                  : `${list.length} room${list.length === 1 ? "" : "s"}`}
                {!loading && search.trim() ? " matching your search" : ""}
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-[220px]">
                <FiSearch
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search restaurant, notes, creator…"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                {sorts.map((sort) => (
                  <option key={sort.key} value={sort.key}>
                    {sort.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            {loading ? (
              <ul className="space-y-3">
                <li>
                  <Skeleton className="h-28 w-full" />
                </li>
                <li>
                  <Skeleton className="h-28 w-full" />
                </li>
                <li>
                  <Skeleton className="h-28 w-full" />
                </li>
              </ul>
            ) : list.length === 0 ? (
              <div className="p-2">
                <EmptyState
                  title={
                    search.trim()
                      ? "No rooms match your search"
                      : tab === "receipt"
                        ? "Nothing is waiting for a receipt"
                        : "Nothing is waiting for approval"
                  }
                  description={
                    search.trim()
                      ? "Try a different restaurant name, note or creator."
                      : tab === "receipt"
                        ? "Every closed room already has its receipt entered. Rooms land here as soon as they close."
                        : "Once you save a receipt, the room moves here for the final sign-off."
                  }
                  action={
                    <Link
                      href={
                        tab === "receipt" ? "/admin/open-new-room" : "/admin/admin-dashboard"
                      }
                    >
                      <Button size="sm" variant="secondary">
                        {tab === "receipt" ? "Open a new room" : "Back to dashboard"}
                      </Button>
                    </Link>
                  }
                />
              </div>
            ) : (
              <ul className="space-y-3">
                {list.map((room, index) => (
                  <QueueRow
                    key={room.id}
                    room={room}
                    index={index}
                    showReceipt={tab === "receipt"}
                  />
                ))}
              </ul>
            )}
          </div>

          {!loading && list.length > 0 ? (
            <div className="flex flex-col gap-2 border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {tab === "receipt"
                  ? "Enter each receipt to move rooms into final approval."
                  : "Approving a room closes it and writes verified prices to the menu."}
              </span>

              {tab === "approval" && awaitingValue > 0 ? (
                <span className="font-medium tabular-nums text-slate-700">
                  {formatMoney(awaitingValue)} awaiting approval in this queue
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </PageContainer>
    </>
  );
}