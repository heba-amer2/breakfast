import { createAsyncThunk } from "@reduxjs/toolkit";

import { apiRequest } from "@/features/shared/api/client";
import type { RoomResponse } from "@/features/rooms/store/roomSlice";
import {
  setAdminError,
  setAdminLoading,
  setPendingRooms,
  setUnapprovedRooms,
  setUsers,
  type UserResponse,
} from "@/features/admin/store/adminSlice";

export const fetchUsers = createAsyncThunk(
  "admin/fetchUsers",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setAdminLoading(true));
      dispatch(setAdminError(null));

      const data = await apiRequest<UserResponse[]>("/api/admin/users", {}, true);
      dispatch(setUsers(Array.isArray(data) ? data : []));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch users";
      dispatch(setAdminError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setAdminLoading(false));
    }
  },
);

export const fetchUnapprovedRooms = createAsyncThunk(
  "admin/fetchUnapprovedRooms",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setAdminLoading(true));
      dispatch(setAdminError(null));

      const data = await apiRequest<RoomResponse[]>(
        "/api/admin/rooms/unapproved",
        {},
        true,
      );
      dispatch(setUnapprovedRooms(Array.isArray(data) ? data : []));
      return data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch unapproved rooms";
      dispatch(setAdminError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setAdminLoading(false));
    }
  },
);

export const fetchPendingRooms = createAsyncThunk(
  "admin/fetchPendingRooms",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setAdminLoading(true));
      dispatch(setAdminError(null));

      const data = await apiRequest<RoomResponse[]>(
        "/api/admin/rooms/pending-approval",
        {},
        true,
      );
      dispatch(setPendingRooms(Array.isArray(data) ? data : []));
      return data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch pending rooms";
      dispatch(setAdminError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setAdminLoading(false));
    }
  },
);

export const promoteUser = createAsyncThunk(
  "admin/promoteUser",
  async (userId: number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setAdminError(null));
      const data = await apiRequest<UserResponse>(
        `/api/admin/users/${userId}/promote`,
        { method: "POST" },
        true,
      );
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to promote user";
      dispatch(setAdminError(message));
      return rejectWithValue(message);
    }
  },
);

export const demoteUser = createAsyncThunk(
  "admin/demoteUser",
  async (userId: number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setAdminError(null));
      const data = await apiRequest<UserResponse>(
        `/api/admin/users/${userId}/demote`,
        { method: "POST" },
        true,
      );
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to demote user";
      dispatch(setAdminError(message));
      return rejectWithValue(message);
    }
  },
);

export const makeAllUsersAdmin = createAsyncThunk(
  "admin/makeAllUsersAdmin",
  async (confirmation: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setAdminError(null));
      const data = await apiRequest<{
        promotedCount?: number;
        alreadyAdminCount?: number;
        totalUsers?: number;
        message?: string;
      }>(
        "/api/admin/users/make-all-admin",
        {
          method: "POST",
          body: JSON.stringify({ confirmation }),
        },
        true,
      );
      return data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to promote all users";
      dispatch(setAdminError(message));
      return rejectWithValue(message);
    }
  },
);

export const approveRoom = createAsyncThunk(
  "admin/approveRoom",
  async (
    {
      roomId,
      payload,
    }: {
      roomId: number;
      payload: {
        items: Array<{ name: string; verifiedPrice: number }>;
        totalDelivery?: number;
        receiptTotal?: number;
        saveToMenu?: boolean;
      };
    },
    { dispatch, rejectWithValue },
  ) => {
    try {
      dispatch(setAdminLoading(true));
      dispatch(setAdminError(null));

      const data = await apiRequest<unknown>(
        `/api/admin/rooms/${roomId}/approve`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        true,
      );

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to approve room";
      dispatch(setAdminError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setAdminLoading(false));
    }
  },
);

export const previewBill = createAsyncThunk(
  "admin/previewBill",
  async (
    { roomId, totalDelivery }: { roomId: number; totalDelivery: number },
    { dispatch, rejectWithValue },
  ) => {
    try {
      dispatch(setAdminError(null));
      const data = await apiRequest<unknown>(
        `/api/admin/rooms/${roomId}/bill-preview?totalDelivery=${encodeURIComponent(String(totalDelivery))}`,
        {},
        true,
      );
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to preview bill";
      dispatch(setAdminError(message));
      return rejectWithValue(message);
    }
  },
);
