"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiClock,
  FiCoffee,
  FiCompass,
  FiFileText,
  FiGrid,
  FiShoppingBag,
} from "react-icons/fi";

import { OpenRoomsSection } from "@/components/dashboard/open-rooms-section";
import { MyRecentRoomsTable } from "@/components/dashboard/my-recent-rooms-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button, CountdownTimer } from "@/components/ui";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { fetchMyRooms, fetchRooms } from "@/features/rooms/store/roomThunks";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import { useActiveRoomsTracker } from "@/features/rooms/hooks/useActiveRoomsTracker";

export default function UserDashboardScreen() {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const rooms = useAppSelector((state) => state.rooms.items);
  const myRooms = useAppSelector((state) => state.rooms.myRooms);
  const roomsError = useAppSelector((state) => state.rooms.error);

  const { user, isAuthenticated } = useAuthFetch(async () => {
    setLoading(true);
    await Promise.all([
      dispatch(fetchRooms(undefined)),
      dispatch(fetchMyRooms()),
    ]);
    setLoading(false);
  });

  // Real-time tracking of active/open rooms
  const { activeRooms, activeCount } = useActiveRoomsTracker(rooms);

  const awaitingPayment = useMemo(
    () =>
      myRooms.filter(
        (room) =>
          room.status === "PENDING_ADMIN_APPROVAL" ||
          room.status === "APPROVED_AND_CLOSED" ||
          room.status === "CLOSED",
      ).length,
    [myRooms],
  );

  const firstName = user?.name?.split(" ")[0] ?? "Team Member";
  const spotlightRoom = activeRooms[0] ?? null;

  return (
    <>
      <TopBar
        title={`Good morning, ${firstName}`}
        subtitle="Order with your team and split breakfast delivery transparently."
        actions={
          <Link href="/user/rooms" className="w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto min-h-[38px] sm:min-h-[36px]">
              <span className="inline-flex items-center justify-center gap-1.5">
                <FiCompass size={14} />
                Explore Rooms
              </span>
            </Button>
          </Link>
        }
      />

      <PageContainer className="space-y-4 sm:space-y-6 pb-8 sm:pb-12">
        {!isAuthenticated ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Checking your session…
          </div>
        ) : null}

        {roomsError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {roomsError}
          </div>
        ) : null}


        {/* Quick KPI Stat Cards */}
        <div className="hidden sm:grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Live Rooms Open"
            value={loading ? "—" : activeCount}
            hint="Currently accepting orders"
            href="/user/rooms"
            tone="emerald"
            icon={<FiGrid size={20} />}
          />
          <StatCard
            label="My Breakfast Orders"
            value={loading ? "—" : myRooms.length}
            hint="Rooms you have joined"
            href="/user/my-orders"
            tone="forest"
            icon={<FiShoppingBag size={20} />}
          />
          <StatCard
            label="Awaiting Split / Pay"
            value={loading ? "—" : awaitingPayment}
            hint="Closed or pending receipt split"
            href="/user/my-orders"
            tone="sage"
            icon={<FiClock size={20} />}
          />
        </div>

        {/* Fast Action Shortcuts */}
        <div className="hidden sm:flex flex-wrap items-center gap-2 sm:gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-3.5 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 w-full sm:w-auto">
            Quick Actions:
          </span>
          <Link
            href="/user/rooms"
            className="inline-flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200 min-h-[38px] sm:min-h-[36px]"
          >
            <FiCompass size={14} className="text-emerald-600" />
            Browse All Rooms
          </Link>
          <Link
            href="/user/restaurants"
            className="inline-flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200 min-h-[38px] sm:min-h-[36px]"
          >
            <FiCoffee size={14} className="text-emerald-700" />
            Verified Menus
          </Link>
          <Link
            href="/user/my-orders"
            className="inline-flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200 min-h-[38px] sm:min-h-[36px]"
          >
            <FiFileText size={14} className="text-emerald-800" />
            My Order Bills
          </Link>
        </div>

        {/* Main Grid: Open Rooms & Recent Activity */}
        <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
          <OpenRoomsSection rooms={activeRooms} loading={loading} />
          <MyRecentRoomsTable rooms={myRooms} loading={loading} />
        </div>

        {/* How It Works Guide Strip */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            How Smart Office Breakfast Works
          </h3>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-800 text-xs font-bold">
                1
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Pick your breakfast
                </p>
                <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                  Join any open room and add menu items or custom dishes before the countdown ends.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-900 text-white text-xs font-bold shadow-xs">
                2
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Receipt verification
                </p>
                <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                  When delivery arrives, an admin enters the exact paper receipt prices into the system.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold">
                3
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Automatic equal split
                </p>
                <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                  Delivery is split equally among all eaters. Check &ldquo;My Bill&rdquo; to see your exact share.
                </p>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
