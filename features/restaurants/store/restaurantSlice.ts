import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type MenuItemDto = {
  id?: number;
  name: string;
  verifiedPrice: number;
  lastVerifiedAt?: string | number[] | null;
};

export type RestaurantResponse = {
  id: number;
  name: string;
  phone?: string | null;
  menuItemCount?: number;
  menu?: MenuItemDto[];
};

type RestaurantState = {
  items: RestaurantResponse[];
  currentRestaurant: RestaurantResponse | null;
  menu: MenuItemDto[];
  loading: boolean;
  error: string | null;
};

const initialState: RestaurantState = {
  items: [],
  currentRestaurant: null,
  menu: [],
  loading: false,
  error: null,
};

const restaurantSlice = createSlice({
  name: "restaurants",
  initialState,
  reducers: {
    setRestaurants: (state, action: PayloadAction<RestaurantResponse[]>) => {
      state.items = action.payload;
    },
    setCurrentRestaurant: (state, action: PayloadAction<RestaurantResponse | null>) => {
      state.currentRestaurant = action.payload;
    },
    setRestaurantMenu: (state, action: PayloadAction<MenuItemDto[]>) => {
      state.menu = action.payload;
    },
    setRestaurantLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setRestaurantError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearRestaurantError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setRestaurants,
  setCurrentRestaurant,
  setRestaurantMenu,
  setRestaurantLoading,
  setRestaurantError,
  clearRestaurantError,
} = restaurantSlice.actions;

export default restaurantSlice.reducer;
