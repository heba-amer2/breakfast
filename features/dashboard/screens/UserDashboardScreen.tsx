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
          <Link href="/user/rooms">
            <Button size="sm">
              <span className="inline-flex items-center gap-1.5">
                <FiCompass size={14} />
                Explore Rooms
              </span>
            </Button>
          </Link>
        }
      />

      <PageContainer className="space-y-6">
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

        {/* Live Order Spotlight Card */}
        {spotlightRoom ? (
          <div className="relative overflow-hidden rounded-3xl border border-emerald-700/50 bg-linear-to-r from-emerald-950 via-emerald-900 to-slate-950 p-6 text-white shadow-lg shadow-emerald-950/20">
            {/* Background glow elements */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-1/4 h-32 w-32 rounded-full bg-emerald-400/15 blur-2xl" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    Live Breakfast Session
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-emerald-200">
                    Room #{spotlightRoom.id}
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    {spotlightRoom.restaurantName}
                  </h2>
                  <p className="mt-1 text-sm text-emerald-100/80 max-w-xl leading-relaxed">
                    {spotlightRoom.description ||
                      "Orders are being pooled right now. Select your items before time runs out."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-200/90 pt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <FiClock size={14} className="text-emerald-400" />
                    {spotlightRoom.secondsRemaining !== null &&
                    spotlightRoom.secondsRemaining !== undefined ? (
                      <span>
                        Closes in{" "}
                        <CountdownTimer
                          secondsRemaining={spotlightRoom.secondsRemaining}
                          expiresAt={spotlightRoom.expiresAt}
                          className="font-bold text-emerald-300"
                        />
                      </span>
                    ) : (
                      <span>Time remaining active</span>
                    )}
                  </span>
                  {spotlightRoom.createdByName ? (
                    <span>Host: {spotlightRoom.createdByName}</span>
                  ) : null}
                  {typeof spotlightRoom.menuItemCount === "number" ? (
                    <span className="inline-flex items-center gap-1">
                      <FiCoffee size={14} className="text-emerald-300" />
                      {spotlightRoom.menuItemCount} items available
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <Link href={`/user/rooms/${spotlightRoom.id}`}>
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-emerald-400 to-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-md shadow-emerald-500/25 transition-all duration-200 hover:from-emerald-300 hover:to-emerald-400 active:scale-98 cursor-pointer"
                  >
                    <span>Order Now</span>
                    <FiArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-emerald-200/60 bg-linear-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                  <FiCoffee size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    No breakfast room is active right now
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    An admin will open today&apos;s ordering session soon. You can explore restaurants in the meantime.
                  </p>
                </div>
              </div>

              <Link href="/user/restaurants">
                <Button variant="secondary" size="sm">
                  View Restaurants &amp; Menus
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Quick KPI Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
            Quick Actions:
          </span>
          <Link
            href="/user/rooms"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200"
          >
            <FiCompass size={14} className="text-emerald-600" />
            Browse All Rooms
          </Link>
          <Link
            href="/user/restaurants"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200"
          >
            <FiCoffee size={14} className="text-emerald-700" />
            Verified Menus
          </Link>
          <Link
            href="/user/my-orders"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200"
          >
            <FiFileText size={14} className="text-emerald-800" />
            My Order Bills
          </Link>
        </div>

        {/* Main Grid: Open Rooms & Recent Activity */}
        <div className="grid gap-6 xl:grid-cols-2">
          <OpenRoomsSection rooms={activeRooms} loading={loading} />
          <MyRecentRoomsTable rooms={myRooms} loading={loading} />
        </div>

        {/* How It Works Guide Strip */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
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
