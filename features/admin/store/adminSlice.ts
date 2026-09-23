import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { RoomResponse } from "@/features/rooms/store/roomSlice";

export type UserResponse = {
  id: number;
  name: string;
  phone: string;
  role: "ADMIN" | "USER";
};

type AdminState = {
  users: UserResponse[];
  unapprovedRooms: RoomResponse[];
  pendingRooms: RoomResponse[];
  loading: boolean;
  error: string | null;
};

const initialState: AdminState = {
  users: [],
  unapprovedRooms: [],
  pendingRooms: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setUsers: (state, action: PayloadAction<UserResponse[]>) => {
      state.users = Array.isArray(action.payload) ? action.payload : [];
    },
    setUnapprovedRooms: (state, action: PayloadAction<RoomResponse[]>) => {
      state.unapprovedRooms = Array.isArray(action.payload) ? action.payload : [];
    },
    setPendingRooms: (state, action: PayloadAction<RoomResponse[]>) => {
      state.pendingRooms = Array.isArray(action.payload) ? action.payload : [];
    },
    setAdminLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setAdminError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearAdminError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setUsers,
  setUnapprovedRooms,
  setPendingRooms,
  setAdminLoading,
  setAdminError,
  clearAdminError,
} = adminSlice.actions;

export default adminSlice.reducer;
