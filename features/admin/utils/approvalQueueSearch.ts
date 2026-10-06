import type { RoomResponse } from "@/features/rooms/store/roomSlice";

export function roomTime(room: RoomResponse): number {
  const value = room.finalizedAt ?? room.createdAt;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
}

export function roomMoment(room: RoomResponse): string | undefined {
  return room.finalizedAt ?? room.createdAt;
}


export function normalizeSearchText(text: string | null | undefined): string {
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

/**
 * Normalizes phone numbers by stripping non-digit characters (+, -, (, ), spaces).
 */
export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/[^\d]/g, "");
}

function parseRoomIdQuery(query: string): number | null {
  const match = query.trim().match(/^(?:room\s*#?|#)?(\d+)$/i);
  return match ? Number(match[1]) : null;
}


export function matchesRoomSearch(room: RoomResponse, rawQuery: string): boolean {
  const trimmed = rawQuery.trim();
  if (!trimmed) return true;

  // 1. Explicit pure Room ID query (single source of truth for ID queries)
  const targetId = parseRoomIdQuery(trimmed);
  if (targetId !== null) {
    return room.id === targetId;
  }

  // 2. General multi-field search
  const normalizedQuery = normalizeSearchText(trimmed);
  const tokens = normalizedQuery.split(" ").filter(Boolean);
  if (tokens.length === 0) return true;

  const normalizedRestaurantName = normalizeSearchText(room.restaurantName);
  const normalizedDescription = normalizeSearchText(room.description);
  const normalizedCreatedBy = normalizeSearchText(room.createdByName);
  const normalizedPhoneText = normalizeSearchText(room.restaurantPhone);
  const normalizedPhoneDigits = normalizePhoneNumber(room.restaurantPhone);

  return tokens.every((token) => {
    // Check if token represents room.id using the single source of truth
    if (parseRoomIdQuery(token) === room.id) {
      return true;
    }

    // Check phone match (digits-only, if token contains digits)
    const tokenDigits = normalizePhoneNumber(token);
    if (tokenDigits && normalizedPhoneDigits.includes(tokenDigits)) {
      return true;
    }

    // Check text substring matches across fields
    if (
      normalizedRestaurantName.includes(token) ||
      normalizedDescription.includes(token) ||
      normalizedCreatedBy.includes(token) ||
      normalizedPhoneText.includes(token)
    ) {
      return true;
    }

    return false;
  });
}