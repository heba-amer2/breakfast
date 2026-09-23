"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { FiCheckCircle, FiClock, FiInfo, FiPlus } from "react-icons/fi";
import { LuUtensils } from "react-icons/lu";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button, Input } from "@/components/ui";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { fetchRestaurants } from "@/features/restaurants/store/restaurantThunks";
import { createRoom, fetchRooms } from "@/features/rooms/store/roomThunks";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";

type OpenRoomFormValues = {
  mode: "existing" | "new";
  restaurantId: string;
  restaurantName: string;
  restaurantPhone: string;
  description: string;
};

export default function OpenRoomScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const restaurants = useAppSelector((state) => state.restaurants.items);
  const rooms = useAppSelector((state) => state.rooms.items);
  const error = useAppSelector((state) => state.rooms.error);

  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OpenRoomFormValues>({
    defaultValues: {
      mode: "existing",
      restaurantId: "",
      restaurantName: "",
      restaurantPhone: "",
      description: "",
    },
  });

  const mode = watch("mode");
  const restaurantId = watch("restaurantId");
  const restaurantName = watch("restaurantName");
  const description = watch("description");

  useAuthFetch(async () => {
    await Promise.all([dispatch(fetchRestaurants()), dispatch(fetchRooms(undefined))]);
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

    let payload: {
      restaurantName: string;
      restaurantPhone?: string;
      description?: string;
      restaurantId?: number;
    };

    if (data.mode === "existing") {
      const selected = restaurants.find(
        (item) => String(item.id) === data.restaurantId,
      );
      if (!selected) {
        setFormError("Please select a restaurant.");
        return;
      }
      payload = {
        restaurantId: selected.id,
        restaurantName: selected.name,
        restaurantPhone: selected.phone ?? undefined,
        description: data.description?.trim() || undefined,
      };
    } else {
      if (!data.restaurantName?.trim()) {
        setFormError("Restaurant name is required.");
        return;
      }
      payload = {
        restaurantName: data.restaurantName.trim(),
        restaurantPhone: data.restaurantPhone?.trim() || undefined,
        description: data.description?.trim() || undefined,
      };
    }

    const result = await dispatch(createRoom(payload));

    if (createRoom.fulfilled.match(result)) {
      router.push(`/admin/rooms/${result.payload.id}/summary`);
      return;
    }

    setFormError(
      typeof result.payload === "string"
        ? result.payload
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

      <PageContainer className="pb-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
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
                Choose an existing restaurant or add a new one, then publish the room for live ordering.
              </p>
            </div>

            <div className="rounded-[28px] border border-emerald-200 bg-emerald-600 p-6 text-white shadow-sm sm:p-7">
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
            className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            noValidate
          >
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                <div className="inline-flex rounded-2xl bg-slate-100 p-1">
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
                        setValue("mode", tab.key);
                        setFormError(null);
                      }}
                      className={[
                        "rounded-xl px-4 py-2.5 text-sm font-medium transition cursor-pointer",
                        mode === tab.key
                          ? "bg-white text-slate-900 shadow-sm font-semibold"
                          : "text-slate-500 hover:text-slate-800",
                      ].join(" ")}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

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
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Input
                        label="Restaurant name"
                        placeholder="e.g. Foul & Falafel"
                        {...register("restaurantName", {
                          validate: (val) =>
                            mode !== "new" ||
                            Boolean(val?.trim()) ||
                            "Restaurant name is required.",
                        })}
                        error={errors.restaurantName?.message}
                        className="rounded-2xl border-slate-200 bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        label="Phone (optional)"
                        placeholder="01xxxxxxxxx"
                        {...register("restaurantPhone")}
                        className="rounded-2xl border-slate-200 bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>
                )}

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
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {formError || error}
                  </p>
                ) : null}
              </div>

              <aside className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
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
                </div>

                <div className="mt-5">
                  <Button
                    fullWidth
                    size="lg"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Opening…" : "Open breakfast room"}
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
