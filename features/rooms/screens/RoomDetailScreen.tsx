"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiDollarSign,
  FiFileText,
  FiGrid,
  FiList,
  FiLock,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiShoppingBag,
  FiTag,
  FiTrash2,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { MenuItemCard } from "@/components/restaurants/menu-card";
import { PhoneLink } from "@/components/shared/phone-link";
import {
  Button,
  CountdownTimer,
  EmptyState,
  Input,
  StatusChip,
} from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
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
import { formatMoney, formatVerifiedDate } from "@/lib/formatters";
import { isRoomActive } from "@/lib/roomUtils";
import {
  getAvailableCategories,
  getCategoryIcon,
  getDishCategory,
  getDishIcon,
  type DishCategory,
} from "@/lib/menuCategories";
import type { MenuItemDto } from "@/features/restaurants/store/restaurantSlice";

type CustomItemFormValues = {
  customName: string;
  customPrice: string;
};

type SortOption = "price-asc" | "price-desc" | "name";

export default function RoomDetailScreen() {
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
  const [selectedCategory, setSelectedCategory] = useState<DishCategory>("All");
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

  // Extract available frontend categories based purely on item names
  const availableCategories = useMemo(
    () => getAvailableCategories(menu),
    [menu],
  );

  // Filter & sort menu items
  const filteredMenu = useMemo(() => {
    let list = menu;

    if (selectedCategory !== "All") {
      list = list.filter(
        (item) => getDishCategory(item.name) === selectedCategory,
      );
    }

    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter((item) => item.name.toLowerCase().includes(query));
    }

    return [...list].sort((a, b) => {
      if (sortKey === "price-asc") return a.verifiedPrice - b.verifiedPrice;
      if (sortKey === "price-desc") return b.verifiedPrice - a.verifiedPrice;
      return a.name.localeCompare(b.name);
    });
  }, [menu, selectedCategory, search, sortKey]);

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

  const hasActiveError = Boolean(roomError || orderError);

  return (
    <>
      <TopBar
        title={room?.restaurantName ? room.restaurantName : "Breakfast Room"}
        subtitle="Select dishes from verified past receipts or add any custom breakfast order."
        tag={isOpen ? "Live Ordering" : "Closed Room"}
        actions={
          <div className="flex items-center gap-2">
            <Link href={isAdmin ? "/admin/admin-dashboard" : "/user/rooms"}>
              <Button variant="secondary" size="sm">
                <span className="inline-flex items-center gap-1.5">
                  <FiArrowLeft size={14} />
                  {isAdmin ? "Dashboard" : "All Rooms"}
                </span>
              </Button>
            </Link>
            {!isOpen && isAdmin ? (
              <Link href={`/admin/rooms/${roomId}/summary`}>
                <Button variant="secondary" size="sm">
                  <span className="inline-flex items-center gap-1.5">
                    <FiFileText size={14} />
                    Calling Sheet
                  </span>
                </Button>
              </Link>
            ) : null}
            <Link href={`/user/rooms/${roomId}/cart`}>
              <Button size="sm" variant={isOpen ? "primary" : "secondary"}>
                <span className="inline-flex items-center gap-1.5">
                  <FiShoppingBag size={14} />
                  My Cart ({cart.length})
                </span>
              </Button>
            </Link>
          </div>
        }
      />

      <PageContainer className="space-y-6 pb-12">
        {/* Error Alert State with Retry Action */}
        {hasActiveError ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <FiAlertCircle size={18} className="shrink-0 text-rose-600" />
              <span>{roomError || orderError}</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadRoomData}
              className="shrink-0 self-start sm:self-auto"
            >
              <span className="inline-flex items-center gap-1.5">
                <FiRefreshCw size={13} />
                Retry
              </span>
            </Button>
          </div>
        ) : null}

        {/* 1. Room Header */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-200/90 bg-linear-to-br from-white via-emerald-50/20 to-emerald-50/30 p-6 sm:p-7 shadow-xs">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-48 rounded-lg" />
              <Skeleton className="h-9 w-72 rounded-xl" />
              <Skeleton className="h-4 w-96 rounded-lg" />
            </div>
          ) : room ? (
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip status={isOpen ? "OPEN" : (room.status || "CLOSED")} />
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                    Room #{room.id}
                  </span>

                  {room.createdByName ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/80 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      <FiUser size={12} className="text-slate-400" />
                      Opened by {room.createdByName}
                    </span>
                  ) : null}

                  {typeof orderSummary?.participantCount === "number" &&
                  orderSummary.participantCount > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200/70">
                      <FiUsers size={12} className="text-emerald-700" />
                      {orderSummary.participantCount}{" "}
                      {orderSummary.participantCount === 1
                        ? "Participant"
                        : "Participants"}
                    </span>
                  ) : null}
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    {room.restaurantName}
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                    {room.description ||
                      "Shared office breakfast order. Items will be delivered together and delivery fee is split equally."}
                  </p>
                </div>

                {room.restaurantPhone ? (
                  <div className="text-xs text-slate-600">
                    Restaurant Contact: <PhoneLink phone={room.restaurantPhone} />
                  </div>
                ) : null}
              </div>

              {/* Countdown Urgency Box */}
              <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl border border-emerald-200/80 bg-white/90 px-6 py-4 text-center shadow-2xs backdrop-blur-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isOpen ? "Ordering Closes In" : "Order Status"}
                </p>
                {isOpen ? (
                  <div className="mt-1.5">
                    <CountdownTimer
                      secondsRemaining={room.secondsRemaining}
                      expiresAt={room.expiresAt}
                      size="lg"
                      showIcon
                      onExpire={() => {
                        dispatch(fetchRoomById(roomId));
                      }}
                    />
                  </div>
                ) : (
                  <p className="mt-1.5 text-base font-bold text-slate-700">
                    Room Closed
                  </p>
                )}
                {isOpen ? (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Orders lock automatically when time reaches zero
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <EmptyState
              title="Room not found"
              description="This breakfast room could not be loaded or may have expired."
            />
          )}
        </div>

        {/* Closed Room Banner with Admin Actions */}
        {!isOpen && room ? (
          <div className="flex flex-col gap-3.5 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                <FiLock size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900">
                    Room Ordering is Closed (Read-Only)
                  </p>
                  <StatusChip status={room.status} size="sm" />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {room.status === "CLOSED"
                    ? "Orders are locked. No additional dishes can be added or modified."
                    : room.status === "PENDING_ADMIN_APPROVAL"
                      ? "Paper receipt has been recorded. Room is awaiting admin approval."
                      : "Final bills are calculated and closed."}
                </p>
              </div>
            </div>

            {isAdmin ? (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link href={`/admin/rooms/${room.id}/summary`}>
                  <Button size="sm" variant="secondary">
                    <span className="inline-flex items-center gap-1.5">
                      <FiFileText size={14} />
                      Calling Sheet
                    </span>
                  </Button>
                </Link>
                {room.status === "CLOSED" ? (
                  <Link href={`/admin/rooms/${room.id}/receipt`}>
                    <Button size="sm" variant="primary">
                      <span className="inline-flex items-center gap-1.5">
                        <FiDollarSign size={14} />
                        Enter Paper Receipt
                      </span>
                    </Button>
                  </Link>
                ) : room.status === "PENDING_ADMIN_APPROVAL" ? (
                  <Link href={`/admin/rooms/${room.id}/approval`}>
                    <Button size="sm" variant="primary">
                      <span className="inline-flex items-center gap-1.5">
                        <FiCheckCircle size={14} />
                        Sign-Off Approval
                      </span>
                    </Button>
                  </Link>
                ) : room.status === "APPROVED_AND_CLOSED" ? (
                  <Link href={`/user/rooms/${room.id}/bill`}>
                    <Button size="sm" variant="secondary">
                      <span className="inline-flex items-center gap-1.5">
                        <FiFileText size={14} />
                        Final Split Bill
                      </span>
                    </Button>
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* 2-Column Ordering Surface: Menu on Left, Sticky Cart & Custom Dish on Right */}
        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
          {/* Left Column: 2. Verified Menu Section */}
          <section className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs">
              {/* Header with Search, Sort, and View Switcher */}
              <div className="flex flex-col gap-3.5 border-b border-slate-100 p-4 sm:p-5 bg-slate-50/50">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Verified Restaurant Menu
                    </h2>
                    <p className="text-xs text-slate-500">
                      {loading
                        ? "Loading catalog…"
                        : `${menu.length} verified dishes from past receipts`}
                    </p>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="inline-flex rounded-xl border border-slate-200/80 bg-white p-1 shadow-2xs self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setViewMode("cards")}
                      aria-label="Cards view"
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                        viewMode === "cards"
                          ? "bg-emerald-50 text-emerald-800 font-bold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <FiGrid size={13} />
                      <span>Cards</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      aria-label="List view"
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                        viewMode === "list"
                          ? "bg-emerald-50 text-emerald-800 font-bold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <FiList size={13} />
                      <span>List</span>
                    </button>
                  </div>
                </div>

                {/* Search & Sort Controls */}
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between pt-1">
                  <div className="relative flex-1 sm:max-w-xs">
                    <FiSearch
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search menu items…"
                      className="h-9.5 w-full rounded-xl border border-slate-200/90 bg-white pl-9.5 pr-8 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                    {search ? (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        aria-label="Clear search"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        <FiX size={13} />
                      </button>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-[11px] font-semibold text-slate-400">
                      Sort:
                    </span>
                    <select
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as SortOption)}
                      aria-label="Sort menu items"
                      className="h-9.5 rounded-xl border border-slate-200/90 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 cursor-pointer"
                    >
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="name">Name: A to Z</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Category Filter Tabs: Responsive horizontal scroll on mobile */}
              {availableCategories.length > 1 ? (
                <div className="border-b border-slate-100 bg-white p-3">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar flex-nowrap sm:flex-wrap">
                    {availableCategories.map(({ category, count }) => {
                      const isSelected = selectedCategory === category;
                      const icon = getCategoryIcon(category, 13);

                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setSelectedCategory(category)}
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer select-none ${
                            isSelected
                              ? "bg-emerald-600 text-white font-bold shadow-xs"
                              : "border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          {icon}
                          <span>{category}</span>
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums ${
                              isSelected
                                ? "bg-emerald-700 text-emerald-100"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* Menu Content: Loading, Empty, Cards, or List */}
              {loading ? (
                <div className="p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-44 w-full rounded-3xl" />
                    ))}
                  </div>
                </div>
              ) : menu.length === 0 ? (
                /* 5. Empty State: When restaurant has no verified menu yet */
                <div className="p-8 text-center sm:p-12">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <FiTag size={26} />
                  </div>
                  <h3 className="mt-3 text-base font-bold text-slate-900">
                    No verified menu available yet.
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                    This restaurant doesn&apos;t have verified catalog dishes yet.
                    You can still order any breakfast dish using the custom dish form on the right!
                  </p>
                </div>
              ) : filteredMenu.length === 0 ? (
                /* Filter/Search Empty State */
                <div className="p-8 text-center sm:p-10">
                  <p className="text-sm font-semibold text-slate-700">
                    No dishes match your filter or search.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Try adjusting your search criteria or resetting categories.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setSelectedCategory("All");
                    }}
                    className="mt-3 inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : viewMode === "cards" ? (
                /* Cards View */
                <div className="grid gap-4 p-4 sm:p-5 sm:grid-cols-2">
                  {filteredMenu.map((item, index) => (
                    <MenuItemCard
                      key={item.id ?? `${item.name}-${index}`}
                      item={item}
                      readOnly={!isOpen}
                      onAddToCart={isOpen ? handleAddMenuItem : undefined}
                      inCartCount={cartItemCounts[item.name.toLowerCase()] || 0}
                    />
                  ))}
                </div>
              ) : (
                /* List View */
                <ul className="divide-y divide-slate-100">
                  {filteredMenu.map((item, index) => {
                    const icon = getDishIcon(item.name, 18);
                    const inCartCount =
                      cartItemCounts[item.name.toLowerCase()] || 0;
                    const isJustAdded = addedItemKey === item.name;
                    const verifiedDate = formatVerifiedDate(item.lastVerifiedAt);

                    return (
                      <li
                        key={item.id ?? `${item.name}-${index}`}
                        className="group flex items-center justify-between gap-4 p-4 transition-colors hover:bg-slate-50/70"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 shadow-2xs group-hover:bg-emerald-50 group-hover:text-emerald-800 transition-colors">
                            {icon}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900 truncate">
                                {item.name}
                              </p>
                              {inCartCount > 0 ? (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                  {inCartCount} in cart
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <span className="font-bold text-emerald-700 tabular-nums">
                                {formatMoney(item.verifiedPrice)}
                              </span>
                              {verifiedDate ? (
                                <>
                                  <span>&middot;</span>
                                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                    <FiShield size={11} className="text-emerald-600" />
                                    Verified {verifiedDate}
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {isOpen ? (
                          <div className="shrink-0">
                            <Button
                              size="sm"
                              variant={inCartCount > 0 ? "secondary" : "primary"}
                              disabled={addingMenuKey === item.name}
                              onClick={() => handleAddMenuItem(item)}
                            >
                              <span className="inline-flex items-center gap-1.5">
                                {isJustAdded ? (
                                  <>
                                    <FiCheck size={14} className="text-emerald-600" />
                                    <span>Added!</span>
                                  </>
                                ) : (
                                  <>
                                    <FiPlus size={14} />
                                    <span>
                                      {inCartCount > 0 ? "Add More" : "Add"}
                                    </span>
                                  </>
                                )}
                              </span>
                            </Button>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* Right Column: 4. Cart Section & 3. Custom Dish Entry */}
          <aside className="space-y-5 xl:sticky xl:top-20 xl:self-start">
            {/* 4. Live User Cart */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                    <FiShoppingBag size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {isOpen ? "My Cart" : "My Order"}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {cart.length} {cart.length === 1 ? "dish" : "dishes"} selected
                    </p>
                  </div>
                </div>

                <span className="text-base font-extrabold tabular-nums text-slate-900">
                  {formatMoney(cartTotal)}
                </span>
              </div>

              {loading ? (
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ) : cart.length === 0 ? (
                <div className="py-7 text-center">
                  <p className="text-xs font-semibold text-slate-700">
                    {isOpen ? "Your cart is empty" : "No items in your cart"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400 max-w-xs mx-auto">
                    {isOpen
                      ? "Select dishes from the verified menu on the left or add a custom dish below."
                      : "You did not place any items in this room."}
                  </p>
                </div>
              ) : (
                <ul className="mt-3.5 divide-y divide-slate-100 max-h-[340px] overflow-y-auto pr-1">
                  {cart.map((item) => {
                    const isCustom = !menuNamesSet.has(
                      item.itemName.toLowerCase().trim(),
                    );
                    const unitPrice =
                      typeof item.verifiedPrice === "number"
                        ? item.verifiedPrice
                        : item.priceAtOrder;
                    const lineTotal =
                      typeof item.lineTotal === "number"
                        ? item.lineTotal
                        : item.priceAtOrder * item.quantity;

                    return (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {item.itemName}
                            </p>
                            {isCustom ? (
                              <span className="shrink-0 rounded-md bg-amber-50 px-1.5 py-0.2 text-[9px] font-bold text-amber-700 border border-amber-200/60">
                                Custom
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {item.quantity} &times; {formatMoney(unitPrice)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-xs font-bold tabular-nums text-slate-900">
                            {formatMoney(lineTotal)}
                          </span>
                          {isOpen ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteCartItem(item.id)}
                              aria-label={`Remove ${item.itemName}`}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                            >
                              <FiTrash2 size={13} />
                            </button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Subtotal & Delivery Note */}
              <div className="mt-4 border-t border-slate-100 pt-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">
                    Food Subtotal
                  </span>
                  <span className="font-extrabold text-slate-900 tabular-nums">
                    {formatMoney(cartTotal)}
                  </span>
                </div>

                <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/60 p-2.5 text-[11px] text-emerald-800 leading-snug">
                  <span className="font-bold">Note on delivery:</span> Delivery fee
                  is split equally among all room participants once the paper receipt is finalized.
                </div>

                {cart.length > 0 ? (
                  <div className="pt-1 flex flex-col gap-2">
                    <Link href={`/user/rooms/${roomId}/cart`} className="w-full">
                      <Button fullWidth size="sm" variant={isOpen ? "primary" : "secondary"}>
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <FiShoppingBag size={14} />
                          {isOpen ? `Review Cart (${cart.length})` : `View My Cart (${cart.length})`}
                        </span>
                      </Button>
                    </Link>
                    {!isOpen ? (
                      <Link href={`/user/rooms/${roomId}/my-bill`} className="w-full">
                        <Button fullWidth size="sm" variant="primary">
                          <span className="inline-flex items-center justify-center gap-1.5">
                            <FiFileText size={14} />
                            View My Bill Split
                          </span>
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            {/* 3. Custom Dish Entry (ONLY RENDERED WHEN ROOM IS OPEN) */}
            {isOpen ? (
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
                <div className="mb-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      Add Custom Dish
                    </h3>
                    <span className="rounded-full bg-emerald-100/90 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Free-Text Order
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Want something not on the verified menu? Enter the dish name below.
                    The price will be verified by an admin from the paper receipt.
                  </p>
                </div>

                <form
                  onSubmit={handleCustomSubmit(onAddCustom)}
                  className="space-y-3"
                  noValidate
                >
                  <Input
                    label="Dish / Item Name *"
                    placeholder="e.g. Extra Tahini, Foul with Olive Oil"
                    {...registerCustom("customName", {
                      required: "Dish name is required",
                      validate: (v) =>
                        Boolean(v?.trim()) || "Dish name cannot be empty",
                    })}
                    error={customErrors.customName?.message}
                    disabled={addingCustom}
                  />

                  <Input
                    label="Estimated Price (Optional in EGP)"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0.00"
                    {...registerCustom("customPrice")}
                    disabled={addingCustom}
                    hint="Admin will enter the exact price from the receipt"
                  />

                  <Button
                    fullWidth
                    size="sm"
                    type="submit"
                    disabled={addingCustom}
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <FiPlus size={14} />
                      {addingCustom ? "Adding to Cart…" : "Add Custom Dish"}
                    </span>
                  </Button>
                </form>
              </div>
            ) : null}

            {/* Room Summary & Participants (RENDERED WHEN ROOM IS CLOSED) */}
            {!isOpen && orderSummary ? (
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Room Order Summary
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {orderSummary.participantCount ?? 0}{" "}
                      {orderSummary.participantCount === 1 ? "participant" : "participants"} ordered
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                    Read-Only
                  </span>
                </div>

                {orderSummary.aggregatedItems && orderSummary.aggregatedItems.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Ordered Dishes ({orderSummary.aggregatedItems.length})
                    </p>
                    <ul className="divide-y divide-slate-100 max-h-52 overflow-y-auto pr-1">
                      {orderSummary.aggregatedItems.map((item, idx) => (
                        <li
                          key={`${item.itemName}-${idx}`}
                          className="flex items-center justify-between py-2 text-xs"
                        >
                          <span className="font-semibold text-slate-800 truncate pr-2">
                            {item.itemName}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-700 tabular-nums text-[11px]">
                              &times;{item.totalQuantity}
                            </span>
                            {typeof item.totalPrice === "number" ? (
                              <span className="font-bold text-slate-900 tabular-nums">
                                {formatMoney(item.totalPrice)}
                              </span>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">
                    No orders were placed in this room.
                  </p>
                )}

                {orderSummary.allOrders && orderSummary.allOrders.length > 0 ? (
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Participants
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {Array.from(
                        new Set(
                          orderSummary.allOrders.map(
                            (o) => o.userName || `User #${o.userId}`,
                          ),
                        ),
                      ).map((name, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 border border-emerald-100"
                        >
                          <FiUser size={11} className="text-emerald-600" />
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Direct Action Links */}
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  {isAdmin && room ? (
                    <Link href={`/admin/rooms/${room.id}/summary`} className="block">
                      <Button fullWidth size="sm" variant="secondary">
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <FiFileText size={14} />
                          Full Calling Sheet
                        </span>
                      </Button>
                    </Link>
                  ) : null}

                  {isAdmin && room && room.status === "CLOSED" ? (
                    <Link href={`/admin/rooms/${room.id}/receipt`} className="block">
                      <Button fullWidth size="sm" variant="primary">
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <FiDollarSign size={14} />
                          Enter Paper Receipt
                        </span>
                      </Button>
                    </Link>
                  ) : null}

                  {room && room.status === "APPROVED_AND_CLOSED" ? (
                    <Link href={`/user/rooms/${room.id}/bill`} className="block">
                      <Button fullWidth size="sm" variant="secondary">
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <FiFileText size={14} />
                          View Final Team Split Bill
                        </span>
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </PageContainer>
    </>
  );
}
