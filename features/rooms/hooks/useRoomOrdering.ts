"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import {
  addOrder,
  deleteOrder,
  fetchMyCart,
  fetchRoomOrderSummary,
} from "@/features/orders/store/orderThunks";
import {
  fetchRoomById,
  fetchRoomMenu,
} from "@/features/rooms/store/roomThunks";
import { isRoomActive } from "@/lib/roomUtils";
import type { MenuItemDto } from "@/features/restaurants/store/restaurantSlice";

export type CustomItemFormValues = {
  customName: string;
  customPrice: string;
};

export type SortOption = "price-asc" | "price-desc" | "name";

export function useRoomOrdering() {
  const params = useParams<{ roomId: string }>();
  const roomId = Number(params.roomId);
  const dispatch = useAppDispatch();

  const room = useAppSelector((state) => state.rooms.currentRoom);
  const menu = useAppSelector((state) => state.rooms.roomMenu);
  const cart = useAppSelector((state) => state.orders.items);
  const orderSummary = useAppSelector((state) => state.orders.summary);
  const roomError = useAppSelector((state) => state.rooms.error);
  const orderError = useAppSelector((state) => state.orders.error);
  const currentUser = useAppSelector((state) => state.auth.user);
  const isAdmin = currentUser?.role === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortOption>("price-asc");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [addingMenuKey, setAddingMenuKey] = useState<string | null>(null);
  const [addedItemKey, setAddedItemKey] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const {
    register: registerCustom,
    handleSubmit: handleCustomSubmit,
    reset: resetCustom,
    formState: { errors: customErrors, isSubmitting: addingCustom },
  } = useForm<CustomItemFormValues>({
    defaultValues: {
      customName: "",
      customPrice: "",
    },
  });

  // Ticker for local countdown precision and active state calculation
  useEffect(() => {
    const ticker = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  // Fetch all room ordering data in parallel
  const loadRoomData = useCallback(async () => {
    if (!Number.isFinite(roomId)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    await Promise.all([
      dispatch(fetchRoomById(roomId)),
      dispatch(fetchRoomMenu(roomId)),
      dispatch(fetchMyCart(roomId)),
      dispatch(fetchRoomOrderSummary(roomId)),
    ]);
    setLoading(false);
  }, [roomId, dispatch]);

  useAuthFetch(loadRoomData, [loadRoomData]);

  const isOpen = isRoomActive(room, now);

  // Calculate live user cart total
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const line =
        typeof item.lineTotal === "number"
          ? item.lineTotal
          : item.priceAtOrder * item.quantity;
      return sum + line;
    }, 0);
  }, [cart]);

  // Filter & sort menu items
  const filteredMenu = useMemo(() => {
    let list = menu;

    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter((item) => item.name.toLowerCase().includes(query));
    }

    return [...list].sort((a, b) => {
      if (sortKey === "price-asc") return a.verifiedPrice - b.verifiedPrice;
      if (sortKey === "price-desc") return b.verifiedPrice - a.verifiedPrice;
      return a.name.localeCompare(b.name);
    });
  }, [menu, search, sortKey]);

  // Map of items in cart for quick quantity lookup
  const cartItemCounts = useMemo(() => {
    const map: Record<string, number> = {};
    cart.forEach((c) => {
      const key = c.itemName.toLowerCase();
      map[key] = (map[key] || 0) + c.quantity;
    });
    return map;
  }, [cart]);

  // Quick lookup to check if a cart item matches a verified catalog menu item
  const menuNamesSet = useMemo(() => {
    return new Set(menu.map((m) => m.name.toLowerCase().trim()));
  }, [menu]);

  // Handle adding an existing verified menu dish
  const handleAddMenuItem = async (item: MenuItemDto) => {
    if (!isOpen) return;
    setAddingMenuKey(item.name);
    setAddedItemKey(item.name);

    const result = await dispatch(
      addOrder({
        roomId,
        payload: {
          itemName: item.name,
          price: item.verifiedPrice,
          quantity: 1,
        },
      }),
    );

    if (addOrder.fulfilled.match(result)) {
      await Promise.all([
        dispatch(fetchMyCart(roomId)),
        dispatch(fetchRoomOrderSummary(roomId)),
      ]);
    }

    setAddingMenuKey(null);
    setTimeout(() => setAddedItemKey(null), 1200);
  };

  // Handle adding a custom dish (first-class free-text entry)
  const onAddCustom = async (data: CustomItemFormValues) => {
    if (!isOpen) return;
    const name = data.customName.trim();
    if (!name) return;

    const parsedPrice = data.customPrice ? Number(data.customPrice) : undefined;
    const result = await dispatch(
      addOrder({
        roomId,
        payload: {
          itemName: name,
          ...(typeof parsedPrice === "number" && !Number.isNaN(parsedPrice)
            ? { price: parsedPrice }
            : {}),
          quantity: 1,
        },
      }),
    );

    if (addOrder.fulfilled.match(result)) {
      resetCustom();
      await Promise.all([
        dispatch(fetchMyCart(roomId)),
        dispatch(fetchRoomOrderSummary(roomId)),
      ]);
    }
  };

  // Handle removing an item from the cart
  const handleDeleteCartItem = async (orderId: number) => {
    if (!isOpen) return;
    const result = await dispatch(deleteOrder({ roomId, orderId }));
    if (deleteOrder.fulfilled.match(result)) {
      await Promise.all([
        dispatch(fetchMyCart(roomId)),
        dispatch(fetchRoomOrderSummary(roomId)),
      ]);
    }
  };

  const handleRoomExpire = useCallback(() => {
    dispatch(fetchRoomById(roomId));
  }, [dispatch, roomId]);

  const resetFilters = useCallback(() => {
    setSearch("");
  }, []);

  const hasActiveError = Boolean(roomError || orderError);

  return {
    roomId,
    room,
    menu,
    cart,
    orderSummary,
    roomError,
    orderError,
    isAdmin,
    loading,
    search,
    setSearch,
    sortKey,
    setSortKey,
    viewMode,
    setViewMode,
    addingMenuKey,
    addedItemKey,
    isOpen,
    cartTotal,
    filteredMenu,
    cartItemCounts,
    menuNamesSet,
    handleAddMenuItem,
    onAddCustom,
    handleDeleteCartItem,
    loadRoomData,
    handleRoomExpire,
    resetFilters,
    hasActiveError,
    registerCustom,
    handleCustomSubmit,
    customErrors,
    addingCustom,
  };
}

