"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchRooms } from "@/features/rooms/store/roomThunks";
import type { RoomResponse } from "@/features/rooms/store/roomSlice";
import { useAppDispatch } from "@/features/shared/store/hooks";
import { filterActiveOpenRooms, filterClosedRooms, isRoomActive } from "@/lib/roomUtils";

interface UseActiveRoomsTrackerOptions {
  autoSyncWithApi?: boolean;
  syncIntervalMs?: number;
}

/**
 * Tracks active open rooms in real-time:
 * 1. Checks that room.status === "OPEN" from the API.
 * 2. Checks that remaining time is strictly > 0.
 * 3. Ticks every second so when countdown hits 0, room is removed immediately without reload.
 * 4. Automatically re-syncs with backend API when a room expires or periodically (15s).
 */
export function useActiveRoomsTracker(
  rooms: RoomResponse[],
  options: UseActiveRoomsTrackerOptions = {},
) {
  const { autoSyncWithApi = true, syncIntervalMs = 15000 } = options;
  const dispatch = useAppDispatch();
  const [now, setNow] = useState(() => Date.now());
  const prevActiveIdsRef = useRef<Set<number>>(new Set());

  // 1-second interval to update remaining countdowns and drop expired rooms
  useEffect(() => {
    const ticker = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  // Filter only rooms that are actually OPEN and not expired
  const activeRooms = useMemo(() => {
    return filterActiveOpenRooms(rooms, now);
  }, [rooms, now]);

  // Filter rooms that are closed or expired
  const closedRooms = useMemo(() => {
    return filterClosedRooms(rooms, now);
  }, [rooms, now]);

  // If a room expires in the UI, trigger background re-sync to get official backend status
  useEffect(() => {
    const currentActiveIds = new Set(activeRooms.map((r) => r.id));
    const previous = prevActiveIdsRef.current;

    let roomExpired = false;
    for (const id of previous) {
      if (!currentActiveIds.has(id)) {
        roomExpired = true;
        break;
      }
    }
    prevActiveIdsRef.current = currentActiveIds;

    if (roomExpired && autoSyncWithApi) {
      dispatch(fetchRooms(undefined));
    }
  }, [activeRooms, autoSyncWithApi, dispatch]);

  // Periodic API synchronization to maintain API as the source of truth
  useEffect(() => {
    if (!autoSyncWithApi) return;

    const syncTimer = setInterval(() => {
      dispatch(fetchRooms(undefined));
    }, syncIntervalMs);

    return () => clearInterval(syncTimer);
  }, [autoSyncWithApi, syncIntervalMs, dispatch]);

  return {
    activeRooms,
    activeCount: activeRooms.length,
    closedRooms,
    closedCount: closedRooms.length,
    now,
    isRoomOpen: (room: RoomResponse) => isRoomActive(room, now),
  };
}

