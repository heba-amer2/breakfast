import { createAsyncThunk } from "@reduxjs/toolkit";

import { apiRequest } from "@/features/shared/api/client";
import {
  setBill,
  setBillingError,
  setBillingLoading,
  setMyBill,
  setReceiptDraft,
  type BillResponse,
  type MyBillResponse,
  type ReceiptDraftResponse,
  type ReceiptEntryPayload,
} from "@/features/billing/store/billingSlice";

export const fetchRoomBill = createAsyncThunk(
  "billing/fetchRoomBill",
  async (roomId: number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setBillingLoading(true));
      dispatch(setBillingError(null));

      const data = await apiRequest<BillResponse>(`/api/rooms/${roomId}/bill`, {}, true);
      dispatch(setBill(data));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch room bill";
      dispatch(setBillingError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setBillingLoading(false));
    }
  },
);

export const fetchBillPreview = createAsyncThunk(
  "billing/fetchBillPreview",
  async (
    { roomId, totalDelivery }: { roomId: number; totalDelivery?: number },
    { dispatch, rejectWithValue },
  ) => {
    try {
      dispatch(setBillingLoading(true));
      dispatch(setBillingError(null));

      const query =
        typeof totalDelivery === "number" && Number.isFinite(totalDelivery)
          ? `?totalDelivery=${encodeURIComponent(String(totalDelivery))}`
          : "";

      const data = await apiRequest<BillResponse>(
        `/api/admin/rooms/${roomId}/bill-preview${query}`,
        {},
        true,
      );

      dispatch(setBill(data));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to preview bill";
      dispatch(setBillingError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setBillingLoading(false));
    }
  },
);

export const fetchMyBill = createAsyncThunk(
  "billing/fetchMyBill",
  async (roomId: number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setBillingLoading(true));
      dispatch(setBillingError(null));

      const data = await apiRequest<MyBillResponse>(`/api/rooms/${roomId}/bill/me`, {}, true);
      dispatch(setMyBill(data));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch my bill";
      dispatch(setBillingError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setBillingLoading(false));
    }
  },
);

export const calculateBill = createAsyncThunk(
  "billing/calculateBill",
  async ({ roomId, totalDelivery }: { roomId: number; totalDelivery: number }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setBillingLoading(true));
      dispatch(setBillingError(null));

      const data = await apiRequest<BillResponse>(
        `/api/rooms/${roomId}/calculate-bill?totalDelivery=${encodeURIComponent(String(totalDelivery))}`,
        { method: "POST" },
        true,
      );

      dispatch(setBill(data));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to calculate bill";
      dispatch(setBillingError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setBillingLoading(false));
    }
  },
);

export const enterReceipt = createAsyncThunk(
  "billing/enterReceipt",
  async (
    { roomId, payload }: { roomId: number; payload: ReceiptEntryPayload },
    { dispatch, rejectWithValue },
  ) => {
    try {
      dispatch(setBillingLoading(true));
      dispatch(setBillingError(null));

      const data = await apiRequest<ReceiptDraftResponse>(
        `/api/rooms/${roomId}/receipt`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        true,
      );

      dispatch(setReceiptDraft(data));
      dispatch(setBill(data.bill ?? null));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to enter receipt";
      dispatch(setBillingError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setBillingLoading(false));
    }
  },
);
