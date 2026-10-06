"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
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
import { Button } from "@/components/ui";
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

  const { user } = useAuthFetch(async () => {
    setLoading(true);
    await Promise.all([
      dispatch(fetchRooms(undefined)),
      dispatch(fetchMyRooms()),
    ]);
    setLoading(false);
  });

  // Real-time tracking of active/open rooms
  const { activeCount } = useActiveRoomsTracker(rooms);

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
        {/* Error alert banner */}
        {roomsError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800 shadow-sm">
            {roomsError}
          </div>
        ) : null}

        {/* 4 Primary Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Open Now"
            value={activeCount}
            hint="Accepting team orders right now"
            icon={<FiCoffee size={20} />}
            tone="emerald"
          />
          <StatCard
            label="My Orders"
            value={myRooms.length}
            hint="Rooms you participated in"
            icon={<FiShoppingBag size={20} />}
            tone="sage"
          />
          <StatCard
            label="Awaiting Split"
            value={awaitingPayment}
            hint="Closed rooms awaiting receipt entry or approval"
            icon={<FiClock size={20} />}
            tone="amber"
          />
          <StatCard
            label="Available Restaurants"
            value={
              Array.from(
                new Set(rooms.map((r) => r.restaurantName).filter(Boolean)),
              ).length
            }
            hint="Venues available for ordering"
            icon={<FiGrid size={20} />}
            tone="default"
          />
        </div>

        {/* Live Active Rooms Section */}
        <OpenRoomsSection
          rooms={rooms}
          loading={loading}
        />

        {/* My Recent Orders / Rooms Table */}
        <MyRecentRoomsTable
          rooms={myRooms}
          loading={loading}
        />

        {/* Quick Help & Workflow Banner */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                How does breakfast ordering work?
              </h3>
              <p className="text-xs text-slate-500 max-w-xl">
                1. Join an open room &rarr; 2. Add dishes with custom notes &rarr; 3. Once closed, admin records the receipt &rarr; 4. Check your split bill share under My Orders.
              </p>
            </div>
            <Link href="/user/orders" className="shrink-0">
              <Button variant="secondary" size="sm">
                <span className="inline-flex items-center gap-1.5">
                  <FiFileText size={13} />
                  My Split Bills
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
