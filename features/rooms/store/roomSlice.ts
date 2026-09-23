import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { MenuItemDto } from "@/features/restaurants/store/restaurantSlice";

export type RoomStatus =
  | "OPEN"
  | "CLOSED"
  | "PENDING_ADMIN_APPROVAL"
  | "APPROVED_AND_CLOSED";

export type RoomResponse = {
  id: number;
  restaurantName: string;
  restaurantPhone?: string;
  description?: string;
  createdAt?: string;
  expiresAt?: string;
  secondsRemaining?: number;
  status?: RoomStatus;
  createdByName?: string;
  restaurantId?: number;
  menuItemCount?: number;
  totalDeliveryFee?: number;
  receiptTotal?: number;
  finalizedAt?: string;
  approvedAt?: string;
  approvedByName?: string;
};

type RoomState = {
  items: RoomResponse[];
  myRooms: RoomResponse[];
  currentRoom: RoomResponse | null;
  roomMenu: MenuItemDto[];
  loading: boolean;
  error: string | null;
};

const initialState: RoomState = {
  items: [],
  myRooms: [],
  currentRoom: null,
  roomMenu: [],
  loading: false,
  error: null,
};

const roomSlice = createSlice({
  name: "rooms",
  initialState,
  reducers: {
    setRooms: (state, action: PayloadAction<RoomResponse[]>) => {
      state.items = Array.isArray(action.payload) ? action.payload : [];
    },
    setMyRooms: (state, action: PayloadAction<RoomResponse[]>) => {
      state.myRooms = Array.isArray(action.payload) ? action.payload : [];
    },
    setCurrentRoom: (state, action: PayloadAction<RoomResponse | null>) => {
      state.currentRoom = action.payload;
    },
    setRoomMenu: (state, action: PayloadAction<MenuItemDto[]>) => {
      state.roomMenu = Array.isArray(action.payload) ? action.payload : [];
    },
    setRoomLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setRoomError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearRoomError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setRooms,
  setMyRooms,
  setCurrentRoom,
  setRoomMenu,
  setRoomLoading,
  setRoomError,
  clearRoomError,
} = roomSlice.actions;

export default roomSlice.reducer;
