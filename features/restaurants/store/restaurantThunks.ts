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

export const createAdminRestaurant = createAsyncThunk(
  "restaurants/createAdminRestaurant",
  async (
    payload: { name: string; phone?: string; menu?: MenuItemDto[] },
    { dispatch, rejectWithValue },
  ) => {
    try {
      dispatch(setRestaurantLoading(true));
      dispatch(setRestaurantError(null));

      const body = {
        name: payload.name.trim(),
        phone: payload.phone?.trim() || undefined,
        menu: Array.isArray(payload.menu)
          ? payload.menu.map((item) => ({
              name: item.name.trim(),
              verifiedPrice: Number(item.verifiedPrice ?? item.price ?? 0),
            }))
          : [],
      };

      const data = await apiRequest<RestaurantResponse>("/api/admin/restaurants", {
        method: "POST",
        body: JSON.stringify(body),
      }, true);

      // Re-fetch all restaurants so state is updated
      await dispatch(fetchRestaurants());
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create restaurant";
      dispatch(setRestaurantError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setRestaurantLoading(false));
    }
  },
);

export const bulkImportRestaurant = createAdminRestaurant;

export const upsertMenuItem = createAsyncThunk(
  "restaurants/upsertMenuItem",
  async (
    {
      restaurantId,
      name,
      price,
    }: {
      restaurantId: number;
      name: string;
      price: number;
    },
    { dispatch, rejectWithValue },
  ) => {
    try {
      dispatch(setRestaurantLoading(true));
      dispatch(setRestaurantError(null));

      const data = await apiRequest<MenuItemDto>(
        `/api/admin/restaurants/${restaurantId}/menu`,
        {
          method: "POST",
          body: JSON.stringify({ name: name.trim(), price }),
        },
        true,
      );

      // Refresh the restaurant's menu
      await dispatch(fetchRestaurantMenu(restaurantId));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save menu item";
      dispatch(setRestaurantError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setRestaurantLoading(false));
    }
  },
);

export const deleteMenuItem = createAsyncThunk(
  "restaurants/deleteMenuItem",
  async (
    {
      restaurantId,
      menuItemId,
    }: {
      restaurantId: number;
      menuItemId: number;
    },
    { dispatch, rejectWithValue },
  ) => {
    try {
      dispatch(setRestaurantLoading(true));
      dispatch(setRestaurantError(null));

      await apiRequest<void>(
        `/api/admin/restaurants/${restaurantId}/menu/${menuItemId}`,
        {
          method: "DELETE",
        },
        true,
      );

      // Refresh the restaurant's menu
      await dispatch(fetchRestaurantMenu(restaurantId));
      return menuItemId;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete menu item";
      dispatch(setRestaurantError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setRestaurantLoading(false));
    }
  },
);
