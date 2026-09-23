import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { MenuItemDto } from "@/features/restaurants/store/restaurantSlice";

export type BillResponse = {
  roomId: number;
  restaurantName?: string;
  totalDelivery?: number;
  participantCount?: number;
  deliverySharePerPerson?: number;
  totalFoodCost?: number;
  grandTotal?: number;
  breakdown?: Array<{
    userId: number;
    userName?: string;
    foodSubtotal: number;
    deliveryShare: number;
    finalTotal: number;
  }>;
  roomStatus?: string;
  pricesVerified?: boolean;
};

export type MyBillResponse = {
  roomId: number;
  restaurantName?: string;
  roomStatus?: string;
  pricesVerified?: boolean;
  participantCount?: number;
  deliverySharePerPerson?: number;
  foodSubtotal?: number;
  deliveryShare?: number;
  finalTotal?: number;
};

export type ReceiptDraftResponse = {
  roomId?: number;
  status?: string;
  bill?: BillResponse;
  unpricedItems?: string[];
  reconciliationDelta?: number;
};

export type ReceiptEntryPayload = {
  items: MenuItemDto[];
  totalDelivery: number;
  receiptTotal?: number;
};

type BillingState = {
  bill: BillResponse | null;
  myBill: MyBillResponse | null;
  receiptDraft: ReceiptDraftResponse | null;
  loading: boolean;
  error: string | null;
};

const initialState: BillingState = {
  bill: null,
  myBill: null,
  receiptDraft: null,
  loading: false,
  error: null,
};

const billingSlice = createSlice({
  name: "billing",
  initialState,
  reducers: {
    setBill: (state, action: PayloadAction<BillResponse | null>) => {
      state.bill = action.payload;
    },
    setMyBill: (state, action: PayloadAction<MyBillResponse | null>) => {
      state.myBill = action.payload;
    },
    setReceiptDraft: (state, action: PayloadAction<ReceiptDraftResponse | null>) => {
      state.receiptDraft = action.payload;
    },
    setBillingLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setBillingError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearBillingError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setBill,
  setMyBill,
  setReceiptDraft,
  setBillingLoading,
  setBillingError,
  clearBillingError,
} = billingSlice.actions;

export default billingSlice.reducer;
