"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiInfo,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import { LuUtensils } from "react-icons/lu";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button, Input } from "@/components/ui";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import {
  createAdminRestaurant,
  fetchRestaurants,
} from "@/features/restaurants/store/restaurantThunks";
import { createRoom, fetchRooms } from "@/features/rooms/store/roomThunks";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import type { MenuItemDto } from "@/features/restaurants/store/restaurantSlice";

type OpenRoomFormValues = {
  restaurantId: string;
  restaurantName: string;
  restaurantPhone: string;
  description: string;
  initialMenu: Array<{
    name: string;
    price: string;
  }>;
};

export default function OpenRoomScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const restaurants = useAppSelector((state) => state.restaurants.items);
  const rooms = useAppSelector((state) => state.rooms.items);
  const error = useAppSelector((state) => state.rooms.error);

  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<OpenRoomFormValues>({
    defaultValues: {
      restaurantId: "",
      restaurantName: "",
      restaurantPhone: "",
      description: "",
      initialMenu: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "initialMenu",
  });

  const restaurantId = useWatch({ control, name: "restaurantId" });
  const restaurantName = useWatch({ control, name: "restaurantName" });
  const description = useWatch({ control, name: "description" });

  useAuthFetch(async () => {
    await Promise.all([
      dispatch(fetchRestaurants()),
      dispatch(fetchRooms(undefined)),
    ]);
  });

  const selectedRestaurant = useMemo(
    () => restaurants.find((item) => String(item.id) === restaurantId),
    [restaurants, restaurantId],
  );

  const liveRoomsCount = useMemo(
    () => rooms.filter((room) => room.status === "OPEN").length,
    [rooms],
  );

  const latestRoom = useMemo(
    () =>
      [...rooms].sort(
        (a, b) =>
          (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
          (a.createdAt ? new Date(a.createdAt).getTime() : 0),
      )[0],
    [rooms],
  );

  const previewName =
    mode === "existing"
      ? selectedRestaurant?.name || "Selected restaurant"
      : restaurantName?.trim() || "New restaurant";

  const onSubmit = async (data: OpenRoomFormValues) => {
    setFormError(null);

    let restaurantIdToUse: number | undefined;
    let restaurantNameToUse: string;
    let restaurantPhoneToUse: string | undefined;

    if (mode === "existing") {
      const selected = restaurants.find(
        (item) => String(item.id) === data.restaurantId,
      );
      if (!selected) {
        setFormError("Please select a restaurant.");
        return;
      }
      restaurantIdToUse = selected.id;
      restaurantNameToUse = selected.name;
      restaurantPhoneToUse = selected.phone ?? undefined;
    } else {
      // New restaurant mode
      const trimmedName = data.restaurantName?.trim();
      if (!trimmedName) {
        setFormError("Restaurant name is required.");
        return;
      }

      // Check for duplicate restaurant name against existing restaurants
      const isDuplicate = restaurants.some(
        (r) => r.name.trim().toLowerCase() === trimmedName.toLowerCase(),
      );
      if (isDuplicate) {
        setFormError(
          "A restaurant with this name already exists. Please choose a different name or select it from 'Existing restaurant'.",
        );
        return;
      }

      // Format initial menu items (if any entered)
      const formattedMenu: MenuItemDto[] = (data.initialMenu || [])
        .filter((item) => item.name?.trim() && !isNaN(Number(item.price)) && Number(item.price) > 0)
        .map((item) => ({
          name: item.name.trim(),
          verifiedPrice: Number(item.price),
        }));

      // If initial menu items are provided, register the restaurant with verified menu items first
      if (formattedMenu.length > 0) {
        const restaurantResult = await dispatch(
          createAdminRestaurant({
            name: trimmedName,
            phone: data.restaurantPhone?.trim() || undefined,
            menu: formattedMenu,
          }),
        );

        if (createAdminRestaurant.fulfilled.match(restaurantResult)) {
          const createdRestaurant = restaurantResult.payload;
          restaurantIdToUse = createdRestaurant.id;
          restaurantNameToUse = createdRestaurant.name;
          restaurantPhoneToUse = createdRestaurant.phone ?? undefined;
        } else {
          const errorMsg =
            (restaurantResult.payload as string) ||
            "Failed to create new restaurant. Please check the information and try again.";
          setFormError(errorMsg);
          return;
        }
      } else {
        // Zero initial menu items: RoomService.createRoom automatically creates/finds the restaurant with 0 items
        restaurantNameToUse = trimmedName;
        restaurantPhoneToUse = data.restaurantPhone?.trim() || undefined;
      }
    }

    // Step 2: Open the room linked to this restaurant
    const roomPayload = {
      ...(restaurantIdToUse ? { restaurantId: restaurantIdToUse } : {}),
      restaurantName: restaurantNameToUse,
      restaurantPhone: restaurantPhoneToUse,
      description: data.description?.trim() || undefined,
    };

    const roomResult = await dispatch(createRoom(roomPayload));

    if (createRoom.fulfilled.match(roomResult)) {
      router.push(`/admin/rooms/${roomResult.payload.id}/summary`);
      return;
    }

    setFormError(
      typeof roomResult.payload === "string"
        ? roomResult.payload
        : "Failed to open room.",
    );
  };

  return (
    <>
      <TopBar
        title="Open a Room"
        subtitle="Create a breakfast room and let the team order while it is active."
        tag="ADMIN OPS"
      />

      <PageContainer className="space-y-4 sm:space-y-6 pb-8 sm:pb-12">
        <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="rounded-2xl sm:rounded-[28px] border border-slate-200 bg-white p-5 sm:p-8 shadow-xs sm:shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">
                    Quick setup
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    Create breakfast room
                  </h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <FiPlus size={20} />
                </div>
              </div>

              <p className="mt-3 max-w-xl text-sm text-slate-600">
                Choose an existing restaurant or add a new one with its starting menu, then publish the room for live ordering.
              </p>
            </div>

            <div className="hidden lg:block rounded-2xl sm:rounded-[28px] border border-emerald-200 bg-emerald-600 p-5 sm:p-7 text-white shadow-xs sm:shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                  <FiClock size={18} />
                </div>
                <span className="text-sm font-medium text-emerald-50">Room timer</span>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-3xl font-bold">{liveRoomsCount}</p>
                  <p className="mt-1 text-sm text-emerald-100">
                    {liveRoomsCount === 1 ? "room live right now" : "rooms live right now"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 text-sm text-emerald-50">
                  {latestRoom
                    ? `${latestRoom.restaurantName} is currently active.`
                    : "No active rooms yet. Your next room will appear here."}
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-2xl sm:rounded-[30px] border border-slate-200 bg-white p-4 sm:p-6 shadow-xs sm:shadow-sm"
            noValidate
          >
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                {/* Mode Selector */}
                <div className="inline-flex w-full sm:w-auto max-w-full rounded-2xl bg-slate-100 p-1">
                  {(
                    [
                      { key: "existing", label: "Existing restaurant" },
                      { key: "new", label: "New restaurant" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setMode(tab.key);
                        setFormError(null);
                        clearErrors();
                      }}
                      className={[
                        "flex-1 sm:flex-none text-center rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition cursor-pointer whitespace-nowrap min-h-[38px] sm:min-h-[36px]",
                        mode === tab.key
                          ? "bg-white text-slate-900 shadow-sm font-semibold"
                          : "text-slate-500 hover:text-slate-800",
                      ].join(" ")}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Existing Restaurant Selection */}
                {mode === "existing" ? (
                  <div>
                    <label
                      htmlFor="restaurant-select"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Restaurant
                    </label>
                    <select
                      id="restaurant-select"
                      {...register("restaurantId", {
                        validate: (val) =>
                          mode !== "existing" ||
                          Boolean(val) ||
                          "Please select a restaurant.",
                      })}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 cursor-pointer"
                    >
                      <option value="">Select a restaurant…</option>
                      {restaurants.map((restaurant) => (
                        <option key={restaurant.id} value={restaurant.id}>
                          {restaurant.name}
                          {restaurant.phone ? ` · ${restaurant.phone}` : ""}
                        </option>
                      ))}
                    </select>
                    {errors.restaurantId ? (
                      <p className="mt-1.5 text-xs font-medium text-rose-600">
                        {errors.restaurantId.message}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  /* New Restaurant Details + Initial Menu Items */
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Input
                          label="Restaurant name *"
                          placeholder="e.g. Foul & Falafel, Zooba, El Shabrawy"
                          {...register("restaurantName", {
                            validate: (val) => {
                              if (mode !== "new") return true;
                              const trimmed = val?.trim();
                              if (!trimmed) return "Restaurant name is required.";
                              const isDuplicate = restaurants.some(
                                (r) =>
                                  r.name.trim().toLowerCase() ===
                                  trimmed.toLowerCase(),
                              );
                              if (isDuplicate) {
                                return "A restaurant with this name already exists.";
                              }
                              return true;
                            },
                          })}
                          error={errors.restaurantName?.message}
                          className="rounded-2xl border-slate-200 bg-slate-50 focus:bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          label="Phone (optional)"
                          placeholder="e.g. 01xxxxxxxxx or landline"
                          {...register("restaurantPhone")}
                          className="rounded-2xl border-slate-200 bg-slate-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Initial Menu Items Section */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5 space-y-4">
                      <div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-slate-800">
                              Initial Menu Items
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                              These items will be added to the restaurant&apos;s verified menu and made available immediately in the room. (Optional)
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => append({ name: "", price: "" })}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-50 hover:border-emerald-400 transition cursor-pointer w-full sm:w-auto min-h-[38px] sm:min-h-[36px]"
                          >
                            <FiPlus size={14} />
                            <span>+ Add Menu Item</span>
                          </button>
                        </div>
                      </div>

                      {fields.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-4 text-center">
                          <p className="text-xs text-slate-400 italic">
                            No initial menu items added.
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            You can open the room without starting dishes, add them anytime later from Restaurants &amp; Menus, or let users add custom dishes.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {fields.map((field, index) => (
                            <div
                              key={field.id}
                              className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                  Item {index + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  aria-label={`Remove item ${index + 1}`}
                                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                                >
                                  <FiTrash2 size={13} />
                                  <span>Remove</span>
                                </button>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <label
                                    htmlFor={`initialMenu-${index}-name`}
                                    className="mb-1 block text-xs font-medium text-slate-700"
                                  >
                                    Item name *
                                  </label>
                                  <input
                                    id={`initialMenu-${index}-name`}
                                    placeholder="e.g. Foul Mudammas, Falafel"
                                    maxLength={150}
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                    {...register(
                                      `initialMenu.${index}.name` as const,
                                      {
                                        required: "Item name is required",
                                        validate: (val) =>
                                          Boolean(val?.trim()) ||
                                          "Name cannot be empty",
                                      },
                                    )}
                                  />
                                  {errors.initialMenu?.[index]?.name ? (
                                    <p className="mt-1 text-[10px] font-medium text-rose-600">
                                      {errors.initialMenu[index]?.name?.message}
                                    </p>
                                  ) : null}
                                </div>

                                <div>
                                  <label
                                    htmlFor={`initialMenu-${index}-price`}
                                    className="mb-1 block text-xs font-medium text-slate-700"
                                  >
                                    Price (EGP) *
                                  </label>
                                  <input
                                    id={`initialMenu-${index}-price`}
                                    type="number"
                                    step="0.5"
                                    min="0.01"
                                    max="100000"
                                    placeholder="e.g. 30"
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                    {...register(
                                      `initialMenu.${index}.price` as const,
                                      {
                                        required: "Price is required",
                                        validate: (val) => {
                                          const num = Number(val);
                                          if (isNaN(num) || num <= 0) return "Price must be > 0";
                                          if (num > 100000) return "Price cannot exceed 100k";
                                          return true;
                                        },
                                      },
                                    )}
                                  />
                                  {errors.initialMenu?.[index]?.price ? (
                                    <p className="mt-1 text-[10px] font-medium text-rose-600">
                                      {errors.initialMenu[index]?.price?.message}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label
                    htmlFor="room-description"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Description (optional)
                  </label>
                  <textarea
                    id="room-description"
                    {...register("description")}
                    placeholder="e.g. Office floor 3, quick lunch round"
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <FiInfo size={16} />
                    </div>
                    <p className="text-sm text-emerald-900">
                      The room stays open for 60 minutes with a live countdown. You can close it earlier from the room summary.
                    </p>
                  </div>
                </div>

                {formError || error ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 shadow-2xs">
                    <FiAlertTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-rose-900">
                        Unable to open room
                      </p>
                      <p className="text-sm font-medium text-rose-700 leading-snug">
                        {formError || error}
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Mobile / Tablet Primary Submit Action (< lg) */}
                <div className="pt-2 lg:hidden">
                  <Button
                    fullWidth
                    size="lg"
                    type="submit"
                    disabled={isSubmitting}
                    className="min-h-[44px]"
                  >
                    {isSubmitting
                      ? mode === "new"
                        ? "Creating & Opening…"
                        : "Opening…"
                      : mode === "new"
                        ? "Create Restaurant & Open Room"
                        : "Open breakfast room"}
                  </Button>
                </div>
              </div>

              {/* Desktop-Only Sidebar Preview (>= lg) */}
              <aside className="hidden lg:block rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <LuUtensils size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Preview
                    </p>
                    <h3 className="text-base font-semibold text-slate-900">
                      Room overview
                    </h3>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    Restaurant
                  </p>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {previewName}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {description?.trim() || "No extra notes added yet."}
                  </p>
                </div>

                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2.5 shadow-sm">
                    <span>Room status</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                      <FiCheckCircle size={12} />
                      Ready
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2.5 shadow-sm">
                    <span>Duration</span>
                    <span className="font-medium text-slate-900">60 min</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2.5 shadow-sm">
                    <span>Order access</span>
                    <span className="font-medium text-slate-900">Live</span>
                  </div>
                  {mode === "new" && fields.length > 0 ? (
                    <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2.5 shadow-sm">
                      <span>Starting dishes</span>
                      <span className="font-bold text-emerald-800">
                        {fields.length} {fields.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-5">
                  <Button
                    fullWidth
                    size="lg"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? mode === "new"
                        ? "Creating & Opening…"
                        : "Opening…"
                      : mode === "new"
                        ? "Create Restaurant & Open Room"
                        : "Open breakfast room"}
                  </Button>
                </div>
              </aside>
            </div>
          </form>
        </div>
      </PageContainer>
    </>
  );
}
