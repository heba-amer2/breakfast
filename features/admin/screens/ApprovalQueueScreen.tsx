"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  FiX,
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

type QueueTab = "receipt" | "approval";
type SortKey = "oldest" | "newest" | "value" | "name";

function roomTime(room: RoomResponse) {
  const value = room.finalizedAt ?? room.createdAt;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
}

function roomMoment(room: RoomResponse) {
  return room.finalizedAt ?? room.createdAt;
}

const ARABIC_FRANCO_SYNONYMS: Record<string, string[]> = {
  // Badr / بدر
  بدر: ["badr", "bader", "badr rest", "badr resturant"],
  badr: ["بدر"],
  bader: ["بدر"],

  // Mat3m / مطعم
  مطعم: ["mat3m", "matam", "rest", "resturant", "restaurant"],
  المطعم: ["mat3m", "matam", "rest", "resturant", "restaurant"],
  mat3m: ["مطعم", "المطعم"],
  matam: ["مطعم", "المطعم"],

  // 7abaib / حبايب
  حبايب: ["7abaib", "habaib", "7abayeb", "habayeb", "el 7abaib", "el 7abayeb"],
  الحبايب: ["7abaib", "habaib", "7abayeb", "habayeb", "el 7abaib", "el 7abayeb"],
  "7abaib": ["حبايب", "الحبايب"],
  habaib: ["حبايب", "الحبايب"],

  // 2dra / قدرة
  قدره: ["2dra", "edra", "qedra", "kudra", "qodra", "odra"],
  القدره: ["2dra", "edra", "qedra", "kudra", "qodra", "odra"],
  قدرة: ["2dra", "edra", "qedra", "kudra", "qodra", "odra"],
  القدرة: ["2dra", "edra", "qedra", "kudra", "qodra", "odra"],
  "2dra": ["قدره", "قدرة", "القدره", "القدرة"],
  edra: ["قدره", "قدرة", "القدره", "القدرة"],
  qedra: ["قدره", "قدرة", "القدره", "القدرة"],

  // Nour / نور
  نور: ["nour", "noor", "nor"],
  النور: ["nour", "noor", "nor"],
  nour: ["نور", "النور"],
  noor: ["نور", "النور"],

  // Radwa / رضوى / رضوي
  رضوي: ["radwa", "radwaaa", "radwaa"],
  رضوى: ["radwa", "radwaaa", "radwaa"],
  الرضوي: ["radwa", "radwaaa", "radwaa"],
  الرضوى: ["radwa", "radwaaa", "radwaa"],
  radwa: ["رضوي", "رضوى", "الرضوي", "الرضوى"],
  radwaaa: ["رضوي", "رضوى", "الرضوي", "الرضوى"],

  // Heba / هبة / هبه
  هبه: ["heba", "hepa"],
  هبة: ["heba", "hepa"],
  الهبه: ["heba", "hepa"],
  الهبة: ["heba", "hepa"],
  heba: ["هبه", "هبة"],

  // Test / تست / تجربة
  تست: ["test", "testt", "testtttttttttttt"],
  تجربه: ["test", "testt"],
  test: ["تست", "تجربه"],

  // New / جديد
  جديد: ["new"],
  الجديد: ["new"],
  new: ["جديد", "الجديد"],
};

function normalizeSearchText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\s+/g, " ");
}

function matchesRoomSearch(room: RoomResponse, rawQuery: string): boolean {
  const query = normalizeSearchText(rawQuery);
  if (!query) return true;

  // 1. Direct ID matching (e.g. "33", "#33", "room 33", "room#33")
  const idMatch = query.match(/^(?:#|room\s*#?)?\s*(\d+)$/i);
  if (idMatch) {
    const targetId = Number(idMatch[1]);
    if (room.id === targetId) return true;
  }

  // 2. Tokenized search for words / terms
  const tokens = query.split(" ").filter(Boolean);

  const restaurantName = normalizeSearchText(room.restaurantName || "");
  const description = normalizeSearchText(room.description || "");
  const createdBy = normalizeSearchText(room.createdByName || "");
  const phone = normalizeSearchText(room.restaurantPhone || "");
  const roomIdStr = room.id.toString();

  return tokens.every((token) => {
    // If token is a pure number or "#number", allow exact matching against room ID
    if (/^#?\d+$/.test(token)) {
      const numOnly = token.replace("#", "");
      if (roomIdStr === numOnly) {
        return true;
      }
      if (numOnly.length >= 7 && phone.includes(numOnly)) {
        return true;
      }
      return false;
    }

    // Direct text substring match
    if (restaurantName.includes(token) || description.includes(token)) {
      return true;
    }

    // Synonym match (Arabic <-> Franco / English)
    const syns = ARABIC_FRANCO_SYNONYMS[token];
    if (syns) {
      for (const syn of syns) {
        const normSyn = normalizeSearchText(syn);
        if (restaurantName.includes(normSyn) || description.includes(normSyn)) {
          return true;
        }
      }
    }

    // Host matching
    if (createdBy.includes(token)) {
      return true;
    }

    // Phone matching (for non-purely numeric or formatted numbers)
    if (token.length >= 7 && phone.includes(token)) {
      return true;
    }

    return false;
  });
}

function QueueRow({
  room,
  index,
  activeTab,
}: {
  room: RoomResponse;
  index: number;
  activeTab: QueueTab;
}) {
  const isPendingApproval = activeTab === "approval" || room.status === "PENDING_ADMIN_APPROVAL";
  const actionHref = isPendingApproval
    ? `/admin/rooms/${room.id}/approval`
    : `/admin/rooms/${room.id}/receipt`;

  const actionLabel = isPendingApproval
    ? "Review & approve"
    : "Enter receipt";

  return (
    <li className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3.5 sm:gap-4">
          <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xs sm:text-sm font-bold tabular-nums text-slate-600">
            {index + 1}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-slate-900">
                {room.restaurantName}
              </h3>
              <StatusChip status={room.status} />
              <span className="text-xs font-semibold text-slate-400">
                #{room.id}
              </span>
            </div>

            <p className="mt-1 line-clamp-1 text-sm text-slate-500">
              {room.description || "Closed room awaiting administrative processing."}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <FiUser size={13} className="text-slate-400" />
                Host: {room.createdByName ?? "Admin"}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <FiClock size={13} className="text-slate-400" />
                {isPendingApproval ? "Receipt saved" : "Closed"}{" "}
                {formatDateTime(roomMoment(room))}
              </span>

              {typeof room.menuItemCount === "number" && room.menuItemCount > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <FiCoffee size={13} className="text-slate-400" />
                  {room.menuItemCount} menu {room.menuItemCount === 1 ? "item" : "items"}
                </span>
              ) : null}

              {typeof room.totalDeliveryFee === "number" && room.totalDeliveryFee > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <FiTruck size={13} className="text-slate-400" />
                  {formatMoney(room.totalDeliveryFee)} delivery
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row sm:items-center lg:justify-end w-full lg:w-auto">
          <div className="flex items-center justify-between sm:block rounded-2xl bg-slate-50 px-4 py-2 sm:py-2.5 text-left sm:text-right w-full sm:w-auto border border-slate-100">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {isPendingApproval ? "Receipt total" : "Items ordered"}
            </p>
            <p className="mt-0.5 text-base sm:text-lg font-bold tabular-nums text-slate-900">
              {isPendingApproval
                ? formatMoney(room.receiptTotal)
                : (room.menuItemCount ?? "—")}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link href={`/admin/rooms/${room.id}/summary`} className="flex-1 sm:flex-none">
              <Button fullWidth size="sm" variant="ghost" className="sm:w-auto min-h-[38px] sm:min-h-[36px]">
                Summary
              </Button>
            </Link>

            <Link href={actionHref} className="flex-1 sm:flex-none">
              <Button fullWidth size="sm" className="sm:w-auto min-h-[38px] sm:min-h-[36px]">
                <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                  {actionLabel}
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

      <PageContainer className="space-y-4 sm:space-y-6 pb-8 sm:pb-12">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {/* The 2 Primary Tabs: Need Receipt vs Need Approval (Shown across all screens) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 rounded-2xl bg-slate-100 p-1.5 border border-slate-200/80">
          {/* Tab 1: Need Receipt */}
          <button
            type="button"
            onClick={() => handleTabChange("receipt")}
            aria-pressed={activeTab === "receipt"}
            className={`flex items-center justify-center gap-2 sm:gap-3 rounded-xl px-3 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer ${
              activeTab === "receipt"
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
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
              {loading ? "—" : hasSearch ? filteredUnapproved.length : unapproved.length}
            </span>
          </button>

          {/* Tab 2: Need Approval */}
          <button
            type="button"
            onClick={() => handleTabChange("approval")}
            aria-pressed={activeTab === "approval"}
            className={`flex items-center justify-center gap-2 sm:gap-3 rounded-xl px-3 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer ${
              activeTab === "approval"
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
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
              {loading ? "—" : hasSearch ? filteredPending.length : pending.length}
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

        {/* Metric Cards Overview (Desktop & Tablet) */}
        <div className="hidden sm:grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Need receipt"
            value={loading ? "—" : unapproved.length}
            hint="Stage 1 · Paper receipt entry"
            tone="sage"
            icon={<FiFileText size={18} />}
          />
          <StatCard
            label="Need approval"
            value={loading ? "—" : pending.length}
            hint="Stage 2 · Final bill sign-off"
            tone="forest"
            icon={<FiCheckSquare size={18} />}
          />
          <StatCard
            label="Total in queue"
            value={loading ? "—" : queueTotal}
            hint="Awaiting receipt or approval"
            tone="emerald"
            icon={<FiClock size={18} />}
          />
          <StatCard
            label="Pending value"
            value={loading ? "—" : formatMoney(awaitingValue)}
            hint="Total awaiting bill approval"
            tone="default"
            icon={<FiDollarSign size={18} />}
          />
        </div>

        {/* Room List Section */}
        <div className="mt-4 sm:mt-6 overflow-hidden rounded-[30px] border border-slate-200 bg-slate-50/60 shadow-sm">
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
                  : `${displayedList.length} ${
                      activeTab === "receipt"
                        ? "room awaiting receipt"
                        : "room awaiting approval"
                    }${displayedList.length === 1 ? "" : "s"}`}
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
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, ID, host…"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
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
                onChange={(event) => setSortKey(event.target.value as SortKey)}
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
                  <QueueRow
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