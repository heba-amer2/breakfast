"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  FiArrowLeft,
  FiCheck,
  FiPlus,
  FiSearch,
  FiShield,
  FiShoppingBag,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import {
  LuCoffee,
  LuCookie,
  LuCroissant,
  LuCupSoda,
  LuEgg,
  LuSalad,
  LuSandwich,
  LuUtensils,
} from "react-icons/lu";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { PhoneLink } from "@/components/shared/phone-link";
import { Button, CountdownTimer, EmptyState, Input, StatusChip } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import {
  addOrder,
  deleteOrder,
  fetchMyCart,
} from "@/features/orders/store/orderThunks";
import {
  fetchRoomById,
  fetchRoomMenu,
} from "@/features/rooms/store/roomThunks";
import { formatMoney, formatVerifiedDate } from "@/lib/formatters";
import { isRoomActive } from "@/lib/roomUtils";

// Helper to assign a semantic Lucide food icon based on common breakfast terms
function getDishIcon(name: string): React.ReactNode {
  const lower = name.toLowerCase();
  if (
    lower.includes("coffee") ||
    lower.includes("latte") ||
    lower.includes("espresso") ||
    lower.includes("cappuccino")
  ) {
    return <LuCoffee size={18} className="text-emerald-800" />;
  }
  if (
    lower.includes("tea") ||
    lower.includes("chai") ||
    lower.includes("juice") ||
    lower.includes("drink")
  ) {
    return <LuCupSoda size={18} className="text-emerald-700" />;
  }
  if (
    lower.includes("croissant") ||
    lower.includes("bread") ||
    lower.includes("toast") ||
    lower.includes("bakery") ||
    lower.includes("pastry")
  ) {
    return <LuCroissant size={18} className="text-emerald-700" />;
  }
  if (
    lower.includes("egg") ||
    lower.includes("omelet") ||
    lower.includes("scramble")
  ) {
    return <LuEgg size={18} className="text-emerald-700" />;
  }
  if (
    lower.includes("sandwich") ||
    lower.includes("burger") ||
    lower.includes("wrap") ||
    lower.includes("panini")
  ) {
    return <LuSandwich size={18} className="text-emerald-800" />;
  }
  if (
    lower.includes("pancake") ||
    lower.includes("waffle") ||
    lower.includes("muffin") ||
    lower.includes("cookie") ||
    lower.includes("bagel")
  ) {
    return <LuCookie size={18} className="text-emerald-700" />;
  }
  if (
    lower.includes("salad") ||
    lower.includes("fruit") ||
    lower.includes("yogurt") ||
    lower.includes("bowl")
  ) {
    return <LuSalad size={18} className="text-emerald-700" />;
  }
  return <LuUtensils size={18} className="text-emerald-700" />;
}

type CustomItemFormValues = {
  customName: string;
  customPrice: string;
};

export default function RoomDetailScreen() {
  const params = useParams<{ roomId: string }>();
  const roomId = Number(params.roomId);
  const dispatch = useAppDispatch();

  const room = useAppSelector((state) => state.rooms.currentRoom);
  const menu = useAppSelector((state) => state.rooms.roomMenu);
  const cart = useAppSelector((state) => state.orders.items);
  const roomError = useAppSelector((state) => state.rooms.error);
  const orderError = useAppSelector((state) => state.orders.error);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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

  useEffect(() => {
    const ticker = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  useAuthFetch(async () => {
    if (!Number.isFinite(roomId)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    await Promise.all([
      dispatch(fetchRoomById(roomId)),
      dispatch(fetchRoomMenu(roomId)),
      dispatch(fetchMyCart(roomId)),
    ]);
    setLoading(false);
  }, [roomId]);

  const isOpen = isRoomActive(room, now);

  const cartTotal = cart.reduce((sum, item) => {
    const line =
      typeof item.lineTotal === "number"
        ? item.lineTotal
        : item.priceAtOrder * item.quantity;
    return sum + line;
  }, 0);

  const filteredMenu = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return menu;
    return menu.filter((item) => item.name.toLowerCase().includes(query));
  }, [menu, search]);

  // Map of items in cart for quick quantity lookup
  const cartItemCounts = useMemo(() => {
    const map: Record<string, number> = {};
    cart.forEach((c) => {
      map[c.itemName.toLowerCase()] =
        (map[c.itemName.toLowerCase()] || 0) + c.quantity;
    });
    return map;
  }, [cart]);

  const handleAddMenuItem = async (itemName: string, price?: number) => {
    if (!isOpen) return;
    setAddingMenuKey(itemName);
    setAddedItemKey(itemName);
    const result = await dispatch(
      addOrder({
        roomId,
        payload: {
          itemName,
          ...(typeof price === "number" ? { price } : {}),
          quantity: 1,
        },
      }),
    );
    if (addOrder.fulfilled.match(result)) {
      await dispatch(fetchMyCart(roomId));
    }
    setAddingMenuKey(null);
    setTimeout(() => setAddedItemKey(null), 1000);
  };

  const onAddCustom = async (data: CustomItemFormValues) => {
    if (!isOpen) return;
    const name = data.customName.trim();
    if (!name) return;

    const priceValue = data.customPrice?.trim()
      ? Number(data.customPrice)
      : undefined;

    const result = await dispatch(
      addOrder({
        roomId,
        payload: {
          itemName: name,
          ...(typeof priceValue === "number" && !Number.isNaN(priceValue)
            ? { price: priceValue }
            : {}),
          quantity: 1,
        },
      }),
    );

    if (addOrder.fulfilled.match(result)) {
      resetCustom();
      await dispatch(fetchMyCart(roomId));
    }
  };

  const handleDelete = async (orderId: number) => {
    if (!isOpen) return;
    const result = await dispatch(deleteOrder({ roomId, orderId }));
    if (deleteOrder.fulfilled.match(result)) {
      await dispatch(fetchMyCart(roomId));
    }
  };

  return (
    <>
      <TopBar
        title={room?.restaurantName ? room.restaurantName : "Breakfast Room"}
        subtitle="Select your breakfast dishes from verified past receipts or add custom orders."
        tag="Live Ordering"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/user/rooms">
              <Button variant="secondary" size="sm">
                <span className="inline-flex items-center gap-1.5">
                  <FiArrowLeft size={14} />
                  All Rooms
                </span>
              </Button>
            </Link>
            <Link href={`/user/rooms/${roomId}/cart`}>
              <Button size="sm">
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
        {roomError || orderError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {roomError || orderError}
          </div>
        ) : null}

        {/* Hero Room Details Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
          {loading ? (
            <Skeleton className="h-28 w-full" />
          ) : room ? (
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip status={isOpen ? "OPEN" : "CLOSED"} />
                  <span className="text-xs font-semibold text-slate-400">
                    Room #{room.id}
                  </span>
                  {room.createdByName ? (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <FiUser size={13} className="text-slate-400" />
                      Opened by {room.createdByName}
                    </span>
                  ) : null}
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    {room.restaurantName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 max-w-2xl leading-relaxed">
                    {room.description ||
                      "Shared office breakfast order. Items will be delivered and split."}
                  </p>
                </div>

                {room.restaurantPhone ? (
                  <div className="text-xs text-slate-600">
                    Restaurant Contact: <PhoneLink phone={room.restaurantPhone} />
                  </div>
                ) : null}
              </div>

              {/* Countdown Urgency Box */}
              <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50/50 px-6 py-4 text-center shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isOpen ? "Ordering Closes In" : "Order Status"}
                </p>
                {isOpen ? (
                  <div className="mt-1">
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
                  <p className="mt-1 text-base font-bold text-slate-700">
                    Room Closed
                  </p>
                )}
                {isOpen ? (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Orders lock when time hits zero
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <EmptyState
              title="Room not found"
              description="This breakfast room could not be loaded or may have been deleted."
            />
          )}
        </div>

        {/* 2-Column Ordering Surface */}
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          {/* Left Column: Menu Items */}
          <section className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
              {/* Header with Search */}
              <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/40">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Restaurant Menu
                  </h3>
                  <p className="text-xs text-slate-500">
                    {loading
                      ? "Loading menu items…"
                      : `${filteredMenu.length} items available`}
                  </p>
                </div>

                <div className="relative min-w-[220px]">
                  <FiSearch
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search menu items…"
                    className="h-9.5 w-full rounded-xl border border-slate-200/90 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              {/* Menu List */}
              {loading ? (
                <div className="space-y-3 p-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : filteredMenu.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    {search ? "No menu items match your search" : "Menu catalog is empty"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {search
                      ? "Try searching for a different dish name."
                      : "You can still add any custom item using the form on the right!"}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filteredMenu.map((item, index) => {
                    const icon = getDishIcon(item.name);
                    const inCartCount =
                      cartItemCounts[item.name.toLowerCase()] || 0;
                    const isJustAdded = addedItemKey === item.name;

                    return (
                      <li
                        key={item.id ?? `${item.name}-${index}`}
                        className="group flex items-center justify-between gap-4 p-4 transition-colors hover:bg-slate-50/70"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 shadow-2xs">
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
                              {item.lastVerifiedAt ? (
                                <>
                                  <span>&middot;</span>
                                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                    <FiShield size={11} className="text-emerald-600" />
                                    Verified {formatVerifiedDate(item.lastVerifiedAt)}
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <Button
                            size="sm"
                            variant={inCartCount > 0 ? "secondary" : "primary"}
                            disabled={!isOpen || addingMenuKey === item.name}
                            onClick={() => handleAddMenuItem(item.name, item.verifiedPrice)}
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
                                    {inCartCount > 0 ? "Add Another" : "Add to Order"}
                                  </span>
                                </>
                              )}
                            </span>
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* Right Column: Sticky Cart & Custom Item Form */}
          <aside className="space-y-5 xl:sticky xl:top-20 xl:self-start">
            {/* My Cart Card */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <FiShoppingBag size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">My Cart</h3>
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
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : cart.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs font-semibold text-slate-700">Your cart is empty</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Click &ldquo;Add to Order&rdquo; on any menu item or add a custom item below.
                  </p>
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {cart.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between py-2.5 text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-slate-900 truncate">
                          {item.itemName}
                        </p>
                        <p className="text-slate-400 text-[11px]">
                          {item.quantity} &times; {formatMoney(item.priceAtOrder)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold tabular-nums text-slate-900">
                          {formatMoney(
                            item.lineTotal ?? item.priceAtOrder * item.quantity,
                          )}
                        </span>
                        {isOpen ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                            aria-label="Remove item"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Subtotal & Delivery Note */}
              <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Food Subtotal</span>
                  <span className="font-extrabold text-slate-900 tabular-nums">
                    {formatMoney(cartTotal)}
                  </span>
                </div>

                <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/60 p-2.5 text-[11px] text-emerald-800 leading-snug">
                  <span className="font-semibold">Note on delivery:</span> Delivery fee is split equally among all participants once the paper receipt is finalized.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                <Link href={`/user/rooms/${roomId}/cart`} className="flex-1">
                  <Button variant="secondary" fullWidth size="sm">
                    Full Cart
                  </Button>
                </Link>
                <Link href={`/user/rooms/${roomId}/my-bill`} className="flex-1">
                  <Button variant="ghost" fullWidth size="sm">
                    My Bill
                  </Button>
                </Link>
              </div>
            </div>

            {/* Custom Item Form with React Hook Form */}
            <form
              onSubmit={handleCustomSubmit(onAddCustom)}
              className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs"
              noValidate
            >
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Add Custom Item
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-snug">
                Item not listed on the menu? Enter it here and the exact price will be verified on the paper receipt.
              </p>

              <div className="mt-4 space-y-3">
                <Input
                  label="Dish / Item Name"
                  placeholder="e.g. Extra Halloumi Cheese"
                  {...registerCustom("customName", {
                    required: "Dish name is required",
                    validate: (v) =>
                      Boolean(v?.trim()) || "Dish name cannot be empty",
                  })}
                  error={customErrors.customName?.message}
                  disabled={!isOpen || addingCustom}
                />
                <Input
                  label="Estimated Price (Optional)"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  {...registerCustom("customPrice")}
                  disabled={!isOpen || addingCustom}
                />
                <Button
                  fullWidth
                  type="submit"
                  disabled={!isOpen || addingCustom}
                >
                  {addingCustom ? "Adding to Cart…" : "Add Custom Dish"}
                </Button>
                {!isOpen ? (
                  <p className="text-center text-xs font-medium text-rose-600">
                    Ordering is closed for this room.
                  </p>
                ) : null}
              </div>
            </form>
          </aside>
        </div>
      </PageContainer>
    </>
  );
}
