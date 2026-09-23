import { configureStore } from "@reduxjs/toolkit";

import authReducer from "@/features/auth/store/authSlice";
import restaurantReducer from "@/features/restaurants/store/restaurantSlice";
import roomReducer from "@/features/rooms/store/roomSlice";
import orderReducer from "@/features/orders/store/orderSlice";
import billingReducer from "@/features/billing/store/billingSlice";
import adminReducer from "@/features/admin/store/adminSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    restaurants: restaurantReducer,
    rooms: roomReducer,
    orders: orderReducer,
    billing: billingReducer,
    admin: adminReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
