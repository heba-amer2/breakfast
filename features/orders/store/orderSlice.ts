import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type OrderItemResponse = {
  id: number;
  userId: number;
  userName?: string;
  itemName: string;
  name?: string;
  priceAtOrder: number;
  price?: number;
  verifiedPrice?: number;
  quantity: number;
  lineTotal?: number;
};

export type AggregatedItemResponse = {
  itemName: string;
  name?: string;
  totalQuantity?: number;
  quantity?: number;
  totalPrice?: number;
  price?: number;
  verifiedUnitPrice?: number;
  verifiedPrice?: number;
};

export type RoomOrderSummary = {
  roomId?: number;
  aggregatedItems?: AggregatedItemResponse[];
  items?: AggregatedItemResponse[];
  allOrders?: OrderItemResponse[];
  orders?: OrderItemResponse[];
  foodTotal?: number;
  participantCount?: number;
  pricesVerified?: boolean;
};

type OrderState = {
  items: OrderItemResponse[];
  summary: RoomOrderSummary | null;
  loading: boolean;
  error: string | null;
};

const initialState: OrderState = {
  items: [],
  summary: null,
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<OrderItemResponse[]>) => {
      state.items = action.payload;
    },
    setOrderSummary: (state, action: PayloadAction<RoomOrderSummary | null>) => {
      state.summary = action.payload;
    },
    clearOrderSummary: (state) => {
      state.summary = null;
    },
    setOrderLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setOrderError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearOrderError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setOrders,
  setOrderSummary,
  clearOrderSummary,
  setOrderLoading,
  setOrderError,
  clearOrderError,
} = orderSlice.actions;

export default orderSlice.reducer;
