import { createAsyncThunk } from "@reduxjs/toolkit";

import { apiRequest } from "@/features/shared/api/client";
import {
  setOrderError,
  setOrderLoading,
  setOrderSummary,
  setOrders,
  type OrderItemResponse,
  type RoomOrderSummary,
} from "@/features/orders/store/orderSlice";

export const fetchMyCart = createAsyncThunk(
  "orders/fetchMyCart",
  async (roomId: number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setOrderLoading(true));
      dispatch(setOrderError(null));

      const data = await apiRequest<OrderItemResponse[]>(`/api/rooms/${roomId}/orders/me`, {}, true);
      dispatch(setOrders(data));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch cart";
      dispatch(setOrderError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setOrderLoading(false));
    }
  },
);

export const addOrder = createAsyncThunk(
  "orders/addOrder",
  async (
    { roomId, payload }: { roomId: number; payload: { itemName: string; price?: number; quantity?: number } },
    { dispatch, rejectWithValue },
  ) => {
    try {
      dispatch(setOrderLoading(true));
      dispatch(setOrderError(null));

      const data = await apiRequest<OrderItemResponse>(`/api/rooms/${roomId}/orders`, {
        method: "POST",
        body: JSON.stringify(payload),
      }, true);

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add order";
      dispatch(setOrderError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setOrderLoading(false));
    }
  },
);

export const deleteOrder = createAsyncThunk(
  "orders/deleteOrder",
  async ({ roomId, orderId }: { roomId: number; orderId: number }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setOrderLoading(true));
      dispatch(setOrderError(null));

      await apiRequest<void>(`/api/rooms/${roomId}/orders/${orderId}`, {
        method: "DELETE",
      }, true);

      return orderId;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete order";
      dispatch(setOrderError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setOrderLoading(false));
    }
  },
);

export const fetchRoomOrderSummary = createAsyncThunk(
  "orders/fetchRoomOrderSummary",
  async (roomId: number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setOrderLoading(true));
      dispatch(setOrderError(null));

      const data = await apiRequest<RoomOrderSummary>(`/api/rooms/${roomId}/orders/summary`, {}, true);
      dispatch(setOrderSummary(data));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch order summary";
      dispatch(setOrderError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setOrderLoading(false));
    }
  },
);
