import type { RoomResponse } from "@/features/rooms/store/roomSlice";

/**
 * Returns the expiration epoch timestamp in milliseconds for a room.
 * Resolves in order:
 * 1. room.expiresAt (ISO string from API)
 * 2. room.createdAt + 60 minutes (fixed 60-minute room lifecycle)
 * 3. fallback to current time + (secondsRemaining * 1000)
 */
export function getRoomExpirationTime(
  room: RoomResponse | null | undefined,
  fallbackReferenceMs: number = Date.now(),
): number | null {
  if (!room) return null;

  if (room.expiresAt) {
    const expireMs = new Date(room.expiresAt).getTime();
    if (!Number.isNaN(expireMs)) {
      return expireMs;
    }
  }

  if (room.createdAt) {
    const createdMs = new Date(room.createdAt).getTime();
    if (!Number.isNaN(createdMs)) {
      // 60-minute fixed room lifecycle
      return createdMs + 60 * 60 * 1000;
    }
  }

  if (typeof room.secondsRemaining === "number") {
    return fallbackReferenceMs + Math.max(0, room.secondsRemaining) * 1000;
  }

  return null;
}

/**
 * Calculates the current remaining seconds for a room at a given reference timestamp.
 */
export function getRoomRemainingSeconds(
  room: RoomResponse | null | undefined,
  referenceTimeMs: number = Date.now(),
): number {
  if (!room || room.status !== "OPEN") {
    return 0;
  }

  const expireTimeMs = getRoomExpirationTime(room, referenceTimeMs);
  if (expireTimeMs !== null) {
    return Math.max(0, Math.floor((expireTimeMs - referenceTimeMs) / 1000));
  }

  if (typeof room.secondsRemaining === "number") {
    return Math.max(0, room.secondsRemaining);
  }

  return 0;
}

/**
 * Determines whether a room is currently active and open for user ordering.
 *
 * Source of truth:
 * 1. API status MUST be "OPEN". If status is CLOSED, PENDING_ADMIN_APPROVAL, or APPROVED_AND_CLOSED, returns false.
 * 2. If room has expired (remaining seconds <= 0 or referenceTime >= expiration timestamp), returns false.
 */
export function isRoomActive(
  room: RoomResponse | null | undefined,
  referenceTimeMs: number = Date.now(),
): boolean {
  if (!room) return false;

  // 1. Check actual room status returned by API (source of truth)
  if (room.status !== "OPEN") {
    return false;
  }

  // 2. Check if API directly gave a non-positive secondsRemaining
  if (typeof room.secondsRemaining === "number" && room.secondsRemaining <= 0) {
    return false;
  }

  // 3. Check expiration timestamp
  const expireTimeMs = getRoomExpirationTime(room, referenceTimeMs);
  if (expireTimeMs !== null && referenceTimeMs >= expireTimeMs) {
    return false;
  }

  return true;
}

/**
 * Filters a list of rooms to only include those that are currently active/open for ordering.
 * Does NOT delete rooms, simply filters the presentation for the active rooms list.
 */
export function filterActiveRooms(
  rooms: RoomResponse[],
  referenceTimeMs: number = Date.now(),
): RoomResponse[] {
  return rooms.filter((room) => isRoomActive(room, referenceTimeMs));
}

export const filterActiveOpenRooms = filterActiveRooms;

/**
 * Filters a list of rooms to only include those that are closed/finished (no longer accepting orders).
 */
export function filterClosedRooms(
  rooms: RoomResponse[],
  referenceTimeMs: number = Date.now(),
): RoomResponse[] {
  return rooms.filter((room) => !isRoomActive(room, referenceTimeMs));
}
