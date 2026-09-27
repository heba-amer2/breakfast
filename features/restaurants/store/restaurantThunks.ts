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

      const validUserMenu = Array.isArray(payload.menu)
        ? payload.menu
            .filter(
              (item) =>
                item.name?.trim() &&
                !isNaN(Number(item.verifiedPrice ?? item.price)) &&
                Number(item.verifiedPrice ?? item.price) > 0,
            )
            .map((item) => ({
              name: item.name.trim(),
              verifiedPrice: Number(item.verifiedPrice ?? item.price ?? 0),
            }))
        : [];

      const hasUserMenu = validUserMenu.length > 0;

      // The backend requires at least one menu item during initial restaurant creation.
      // If the admin leaves initial dishes empty (optional), we create with a temporary placeholder
      // and immediately remove it, ensuring the restaurant is created with 0 dishes as intended.
      const initialMenu = hasUserMenu
        ? validUserMenu
        : [{ name: "__initial_placeholder__", verifiedPrice: 1 }];

      const body = {
        name: payload.name.trim(),
        phone: payload.phone?.trim() || undefined,
        menu: initialMenu,
      };

      const data = await apiRequest<RestaurantResponse>(
        "/api/admin/restaurants",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
        true,
      );

      // If placeholder was used, delete the placeholder menu item immediately
      if (!hasUserMenu && Array.isArray(data.menu) && data.menu.length > 0) {
        const placeholderItem = data.menu[0];
        try {
          await apiRequest<void>(
            `/api/admin/restaurants/${data.id}/menu/${placeholderItem.id}`,
            { method: "DELETE" },
            true,
          );
          data.menu = [];
          data.menuItemCount = 0;
        } catch {
          // If delete fails, proceed gracefully
        }
      }

      // Re-fetch all restaurants so state is updated
      await dispatch(fetchRestaurants());
      return data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create restaurant";
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
