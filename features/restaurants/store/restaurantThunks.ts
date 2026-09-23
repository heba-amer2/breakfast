import { createAsyncThunk } from "@reduxjs/toolkit";

import { apiRequest } from "@/features/shared/api/client";
import {
  setCurrentRestaurant,
  setRestaurantError,
  setRestaurantLoading,
  setRestaurantMenu,
  setRestaurants,
  type MenuItemDto,
  type RestaurantResponse,
} from "@/features/restaurants/store/restaurantSlice";

export const fetchRestaurants = createAsyncThunk(
  "restaurants/fetchRestaurants",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setRestaurantLoading(true));
      dispatch(setRestaurantError(null));

      const data = await apiRequest<RestaurantResponse[]>("/api/restaurants", {}, true);
      dispatch(setRestaurants(Array.isArray(data) ? data : []));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch restaurants";
      dispatch(setRestaurantError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setRestaurantLoading(false));
    }
  },
);

export const fetchRestaurantById = createAsyncThunk(
  "restaurants/fetchRestaurantById",
  async (restaurantId: number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setRestaurantLoading(true));
      dispatch(setRestaurantError(null));

      const data = await apiRequest<RestaurantResponse>(`/api/restaurants/${restaurantId}`, {}, true);
      dispatch(setCurrentRestaurant(data));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch restaurant";
      dispatch(setRestaurantError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setRestaurantLoading(false));
    }
  },
);

export const fetchRestaurantMenu = createAsyncThunk(
  "restaurants/fetchRestaurantMenu",
  async (restaurantId: number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setRestaurantLoading(true));
      dispatch(setRestaurantError(null));

      const data = await apiRequest<MenuItemDto[]>(`/api/restaurants/${restaurantId}/menu`, {}, true);
      dispatch(setRestaurantMenu(Array.isArray(data) ? data : []));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch menu";
      dispatch(setRestaurantError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setRestaurantLoading(false));
    }
  },
);

export const bulkImportRestaurant = createAsyncThunk(
  "restaurants/bulkImportRestaurant",
  async (payload: { name: string; phone?: string; menu: MenuItemDto[] }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setRestaurantLoading(true));
      dispatch(setRestaurantError(null));

      const data = await apiRequest<RestaurantResponse>("/api/admin/restaurants", {
        method: "POST",
        body: JSON.stringify(payload),
      }, true);

      dispatch(setCurrentRestaurant(data));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Restaurant import failed";
      dispatch(setRestaurantError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setRestaurantLoading(false));
    }
  },
);
