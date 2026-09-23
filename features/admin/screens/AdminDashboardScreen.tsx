"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiCheckSquare,
  FiClock,
  FiCoffee,
  FiFileText,
  FiGrid,
  FiPlusCircle,
  FiUsers,
} from "react-icons/fi";

import { StatCard } from "@/components/dashboard/stat-card";
import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button, CountdownTimer, EmptyState, StatusChip } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchPendingRooms,
  fetchUnapprovedRooms,
  fetchUsers,
} from "@/features/admin/store/adminThunks";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { fetchRooms } from "@/features/rooms/store/roomThunks";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import { formatDateTime, formatMoney } from "@/lib/formatters";

export default function AdminDashboardScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const rooms = useAppSelector((state) => state.rooms.items);
  const users = useAppSelector((state) => state.admin.users);
  const unapproved = useAppSelector((state) => state.admin.unapprovedRooms);
  const pending = useAppSelector((state) => state.admin.pendingRooms);
  const error = useAppSelector((state) => state.admin.error);
  const [loading, setLoading] = useState(true);

  useAuthFetch(async () => {
    setLoading(true);
    await Promise.all([
      dispatch(fetchRooms(undefined)),
      dispatch(fetchUsers()),
      dispatch(fetchUnapprovedRooms()),
      dispatch(fetchPendingRooms()),
    ]);
    setLoading(false);
  });

  const openRooms = useMemo(
    () => rooms.filter((room) => room.status === "OPEN"),
    [rooms],
  );

  const firstName = user?.name?.split(" ")[0] ?? "Admin";

  return (
    <>
      <TopBar
        title={`Welcome back, ${firstName}`}
        subtitle="Manage active office rooms, vendor receipt entries, and team bill approvals."
        tag="ADMIN OPS"
        actions={
          <Link href="/admin/open-new-room">
            <Button size="sm" variant="primary">
              <span className="inline-flex items-center gap-1.5">
                <FiPlusCircle size={15} />
                Open Breakfast Room
              </span>
            </Button>
          </Link>
        }
      />

      <PageContainer className="space-y-6 pb-12">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {/* 4 Operations KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Live Rooms Open"
            value={loading ? "—" : openRooms.length}
            hint="Accepting employee orders"
            href="/admin/open-new-room"
            tone="emerald"
            icon={<FiGrid size={20} />}
          />
          <StatCard
            label="Need Receipt"
            value={loading ? "—" : unapproved.length}
            hint="Closed, paper receipt needed"
            href="/admin/approval-queue"
            tone="forest"
            icon={<FiFileText size={20} />}
          />
          <StatCard
            label="Pending Approval"
            value={loading ? "—" : pending.length}
            hint="Receipt entered, awaiting sign-off"
            href="/admin/approval-queue"
            tone="sage"
            icon={<FiCheckSquare size={20} />}
          />
          <StatCard
            label="Registered Team"
            value={loading ? "—" : users.length}
            hint="Office user accounts"
            href="/admin/users-management"
            tone="default"
            icon={<FiUsers size={20} />}
          />
        </div>

        {/* Action Shortcuts Strip */}
        <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
            Operations Shortcuts:
          </span>
          <Link
            href="/admin/open-new-room"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100"
          >
            <FiPlusCircle size={14} className="text-emerald-700" />
            + Open New Room
          </Link>
          <Link
            href="/admin/approval-queue"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200"
          >
            <FiCheckSquare size={14} className="text-emerald-600" />
            Approvals Pipeline ({unapproved.length + pending.length})
          </Link>
          <Link
            href="/admin/restaurants"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200"
          >
            <FiCoffee size={14} className="text-emerald-700" />
            Restaurants &amp; Menus
          </Link>
          <Link
            href="/admin/users-management"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200"
          >
            <FiUsers size={14} className="text-slate-600" />
            Team Roles
          </Link>
        </div>

        {/* 2 Operations Sections */}
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Live Open Rooms section */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    Live Open Rooms
                  </h2>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Call in the order or track item quantities in real time
                </p>
              </div>

              <Link
                href="/admin/open-new-room"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                <span>+ New Room</span>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : openRooms.length === 0 ? (
              <EmptyState
                title="No rooms currently open"
                description="Open a breakfast room to allow team members to start adding orders."
                icon={<FiCoffee size={28} />}
                action={
                  <Link href="/admin/open-new-room">
                    <Button size="sm">Open a Room Now</Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {openRooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-linear-to-r from-white to-emerald-50/40 p-4 transition hover:border-emerald-200 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <StatusChip status={room.status} size="sm" />
                        <h3 className="font-bold text-slate-900 truncate">
                          {room.restaurantName}
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                        {room.description || "Active team breakfast order"}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <FiClock size={12} className="text-emerald-600" />
                          <CountdownTimer
                            secondsRemaining={room.secondsRemaining}
                            expiresAt={room.expiresAt}
                            size="sm"
                          />
                        </span>
                        {typeof room.menuItemCount === "number" ? (
                          <span>{room.menuItemCount} items</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/admin/rooms/${room.id}/summary`}>
                        <Button size="sm" variant="secondary">
                          Telephone Summary
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Attention Required Pipeline */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Needs Attention
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Paper receipt entry &amp; pending final approvals
                </p>
              </div>

              <Link
                href="/admin/approval-queue"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                <span>Full Queue ({unapproved.length + pending.length})</span>
                <FiArrowRight size={13} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : [...unapproved, ...pending].length === 0 ? (
              <EmptyState
                title="All clear! No pending actions"
                description="Every closed room has been priced, split, and approved."
                icon={<FiCheckSquare size={28} />}
              />
            ) : (
              <div className="space-y-3">
                {[...unapproved, ...pending].slice(0, 6).map((room) => {
                  const needsReceipt = room.status === "CLOSED";

                  return (
                    <div
                      key={`${room.status}-${room.id}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs hover:border-emerald-200 transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <StatusChip status={room.status} size="sm" />
                          <h3 className="font-semibold text-slate-900 truncate">
                            {room.restaurantName}
                          </h3>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(room.finalizedAt ?? room.createdAt)} ·{" "}
                          <span className="font-semibold text-slate-800 tabular-nums">
                            {typeof room.receiptTotal === "number"
                              ? formatMoney(room.receiptTotal)
                              : "No receipt yet"}
                          </span>
                        </p>
                      </div>

                      <div className="shrink-0">
                        <Link
                          href={
                            needsReceipt
                              ? `/admin/rooms/${room.id}/receipt`
                              : `/admin/rooms/${room.id}/approval`
                          }
                        >
                          <Button size="sm" variant="primary">
                            <span className="inline-flex items-center gap-1">
                              {needsReceipt ? "Enter Receipt" : "Sign-Off Bill"}
                              <FiArrowRight size={13} />
                            </span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </PageContainer>
    </>
  );
}
