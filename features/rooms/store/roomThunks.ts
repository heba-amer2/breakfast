import { createAsyncThunk } from "@reduxjs/toolkit";

import { apiRequest } from "@/features/shared/api/client";
import type { MenuItemDto } from "@/features/restaurants/store/restaurantSlice";
import {
  setCurrentRoom,
  setMyRooms,
  setRoomError,
  setRoomLoading,
  setRoomMenu,
  setRooms,
  type RoomResponse,
} from "@/features/rooms/store/roomSlice";

export const fetchRooms = createAsyncThunk(
  "rooms/fetchRooms",
  async (status: string | undefined, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setRoomLoading(true));
      dispatch(setRoomError(null));

      const query = status ? `?status=${encodeURIComponent(status)}` : "";
      const data = await apiRequest<RoomResponse[]>(`/api/rooms${query}`, {}, true);
      dispatch(setRooms(Array.isArray(data) ? data : []));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch rooms";
      dispatch(setRoomError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setRoomLoading(false));
    }
  },
);

export const fetchMyRooms = createAsyncThunk(
  "rooms/fetchMyRooms",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setRoomLoading(true));
      dispatch(setRoomError(null));

      const data = await apiRequest<RoomResponse[]>("/api/rooms/mine", {}, true);
      dispatch(setMyRooms(Array.isArray(data) ? data : []));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch my rooms";
      dispatch(setRoomError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setRoomLoading(false));
    }
  },
);

export const fetchRoomById = createAsyncThunk(
  "rooms/fetchRoomById",
  async (roomId: number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setRoomLoading(true));
      dispatch(setRoomError(null));

      const data = await apiRequest<RoomResponse>(`/api/rooms/${roomId}`, {}, true);
      dispatch(setCurrentRoom(data));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch room";
      dispatch(setRoomError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setRoomLoading(false));
    }
  },
);

export const fetchRoomMenu = createAsyncThunk(
  "rooms/fetchRoomMenu",
  async (roomId: number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setRoomError(null));

      const data = await apiRequest<MenuItemDto[]>(
        `/api/rooms/${roomId}/menu`,
        {},
        true,
      );
      dispatch(setRoomMenu(Array.isArray(data) ? data : []));
      return data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch room menu";
      dispatch(setRoomError(message));
      return rejectWithValue(message);
    }
  },
);

export const createRoom = createAsyncThunk(
  "rooms/createRoom",
  async (
    payload: {
      restaurantName: string;
      restaurantPhone?: string;
      description?: string;
      restaurantId?: number;
    },
    { dispatch, rejectWithValue },
  ) => {
    try {
      dispatch(setRoomLoading(true));
      dispatch(setRoomError(null));

      const data = await apiRequest<RoomResponse>(
        "/api/rooms",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        true,
      );

      dispatch(setCurrentRoom(data));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create room";
      dispatch(setRoomError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setRoomLoading(false));
    }
  },
);

export const closeRoom = createAsyncThunk(
  "rooms/closeRoom",
  async (roomId: number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setRoomLoading(true));
      dispatch(setRoomError(null));

      const data = await apiRequest<RoomResponse>(
        `/api/rooms/${roomId}/close`,
        {
          method: "POST",
        },
        true,
      );

      dispatch(setCurrentRoom(data));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to close room";
      dispatch(setRoomError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setRoomLoading(false));
    }
  },
);
