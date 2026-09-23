"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiEdit3,
  FiTruck,
  FiUsers,
} from "react-icons/fi";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button, EmptyState, StatusChip } from "@/components/ui";
import { approveRoom } from "@/features/admin/store/adminThunks";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { fetchRoomById, fetchRoomMenu } from "@/features/rooms/store/roomThunks";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import { formatDateTime, formatMoney } from "@/lib/formatters";

export default function Page() {
  const params = useParams<{ roomId: string }>();
  const roomId = Number(params.roomId);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const room = useAppSelector((state) => state.rooms.currentRoom);
  const menu = useAppSelector((state) => state.rooms.roomMenu);
  const error = useAppSelector((state) => state.rooms.error);
  const adminError = useAppSelector((state) => state.admin.error);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue } = useForm<{
    deliveryFee: number;
    saveToMenu: boolean;
  }>({
    defaultValues: {
      deliveryFee: 0,
      saveToMenu: true,
    },
  });

  const deliveryFee = Number(watch("deliveryFee") || 0);
  const [pricingDrafts, setPricingDrafts] = useState<Record<string, number>>({});

  useAuthFetch(async () => {
    if (!Number.isFinite(roomId)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setSuccess(null);
    await Promise.all([dispatch(fetchRoomById(roomId)), dispatch(fetchRoomMenu(roomId))]);
    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    if (room) {
      setValue("deliveryFee", Number(room.totalDeliveryFee ?? room.receiptTotal ?? 0));
    }
  }, [room, setValue]);

  useEffect(() => {
    const map: Record<string, number> = {};
    menu.forEach((item, index) => {
      const key = `${item.name}-${item.id ?? index}`;
      map[key] = Number(item.verifiedPrice ?? 0);
    });
    setPricingDrafts(map);
  }, [menu]);

  const subtotal = useMemo(
    () =>
      menu.reduce((sum, item, index) => {
        const key = `${item.name}-${item.id ?? index}`;
        return sum + (Number(pricingDrafts[key] ?? item.verifiedPrice ?? 0) || 0);
      }, 0),
    [menu, pricingDrafts],
  );

  const receiptTotal = subtotal + deliveryFee;

  const handlePriceChange = (key: string, value: string) => {
    const parsed = Number(value);
    setPricingDrafts((current) => ({
      ...current,
      [key]: Number.isFinite(parsed) ? Math.max(0, parsed) : 0,
    }));
  };

  const handleApprove = async (formData: { deliveryFee: number; saveToMenu: boolean }) => {
    if (!room || menu.length === 0) return;

    const effectiveDelivery = typeof formData.deliveryFee === "number" ? formData.deliveryFee : deliveryFee;
    const effectiveSaveToMenu = Boolean(formData.saveToMenu);
    const finalReceiptTotal = subtotal + effectiveDelivery;

    setSubmitting(true);
    setSuccess(null);

    const result = await dispatch(
      approveRoom({
        roomId: room.id,
        payload: {
          items: menu.map((item, index) => ({
            name: item.name,
            verifiedPrice: Number(
              pricingDrafts[`${item.name}-${item.id ?? index}`] ?? item.verifiedPrice ?? 0,
            ),
          })),
          totalDelivery: effectiveDelivery,
          receiptTotal: finalReceiptTotal,
          saveToMenu: effectiveSaveToMenu,
        },
      }),
    );

    setSubmitting(false);

    if (approveRoom.fulfilled.match(result)) {
      setSuccess("Room approved and billing summary saved successfully.");
      router.push(`/admin/rooms/${room.id}/summary`);
    }
  };

  return (
    <>
      <TopBar
        title={room?.restaurantName ? `Approve · ${room.restaurantName}` : "Approve room"}
        subtitle={
          room
            ? `Review verified menu prices and finalize the room bill for ${formatDateTime(room.createdAt)}`
            : "Loading room details…"
        }
        tag="ADMIN OPS"
        actions={
          <Link href={room ? `/admin/rooms/${room.id}/summary` : "/admin/rooms"}>
            <Button size="sm" variant="secondary">
              <span className="inline-flex items-center gap-1.5">
                <FiArrowLeft size={14} />
                Back to summary
              </span>
            </Button>
          </Link>
        }
      />

      <PageContainer className="pb-10">
        {room?.status === "OPEN" ? (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-900 shadow-sm">
            <div className="flex items-center gap-2.5">
              <FiClock size={18} className="shrink-0 text-amber-600" />
              <span>
                <strong>Room is currently OPEN:</strong> Final bill approval is performed after the 60-minute window closes and paper receipt is recorded.
              </span>
            </div>
            <Link href={`/user/rooms/${room.id}`}>
              <Button variant="secondary" size="sm">
                View Live Room
              </Button>
            </Link>
          </div>
        ) : null}

        {error || adminError ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-800 shadow-sm">
            {error || adminError}
          </div>
        ) : null}

        {success ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
            {success}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-4">
            <div className="h-36 animate-pulse rounded-3xl bg-slate-100" />
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="h-80 animate-pulse rounded-3xl bg-slate-100" />
              <div className="h-80 animate-pulse rounded-3xl bg-slate-100" />
            </div>
          </div>
        ) : !room ? (
          <EmptyState
            title="Room not found"
            description="This approval request could not be loaded."
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <section className="space-y-5">
              <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                      Approval review
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">
                      {room.restaurantName}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-600">
                      {room.description || "No room description added yet."}
                    </p>
                  </div>

                  <StatusChip status={room.status} className="text-sm" />
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Opened
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-slate-900">
                      <FiClock size={16} className="text-slate-400" />
                      <span className="font-medium">{formatDateTime(room.createdAt)}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Creator
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-slate-900">
                      <FiUsers size={16} className="text-slate-400" />
                      <span className="font-medium">{room.createdByName ?? "Admin"}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Menu items
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-slate-900">
                      <FiEdit3 size={16} className="text-slate-400" />
                      <span className="font-medium">{menu.length} items</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Pricing verification
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    Verify and adjust item prices
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Update prices to match the final paper receipt before closing the room.
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  {menu.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                      No menu items to approve in this room.
                    </div>
                  ) : (
                    menu.map((item, index) => {
                      const key = `${item.name}-${item.id ?? index}`;
                      return (
                        <div
                          key={key}
                          className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-400">
                              Estimated price: {formatMoney(item.verifiedPrice ?? 0)}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">Verified price</span>
                            <div className="flex items-center gap-1.5">
                              <label className="flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                                <FiDollarSign size={14} className="text-slate-400" />
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={pricingDrafts[key] ?? 0}
                                  onChange={(event) => handlePriceChange(key, event.target.value)}
                                  className="w-24 border-0 bg-transparent text-right text-sm text-slate-900 outline-none"
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Bill summary
                </p>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                    <span>Food subtotal</span>
                    <span className="font-semibold text-slate-900">{formatMoney(subtotal)}</span>
                  </div>

                  <label className="block rounded-2xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                    <span className="mb-2 flex items-center gap-2">
                      <FiTruck size={14} className="text-slate-400" />
                      Delivery fee
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      {...register("deliveryFee", { valueAsNumber: true })}
                      className="w-full border-0 bg-transparent text-base font-medium text-slate-900 outline-none"
                    />
                  </label>

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3">
                    <div className="flex items-center justify-between text-sm text-emerald-800">
                      <span>Total receipt</span>
                      <span className="text-lg font-bold">{formatMoney(receiptTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      {...register("saveToMenu")}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Save approved prices back to restaurant menu
                  </label>
                </div>

                <div className="mt-5 space-y-3">
                  <Button
                    fullWidth
                    size="lg"
                    type="button"
                    onClick={handleSubmit(handleApprove)}
                    disabled={submitting || menu.length === 0}
                  >
                    <span className="inline-flex items-center gap-2">
                      <FiCheckCircle size={16} />
                      {submitting ? "Approving…" : "Approve room"}
                    </span>
                  </Button>

                  <Link href={`/admin/rooms/${room.id}/summary`} className="block">
                    <Button fullWidth variant="secondary" type="button">
                      View summary
                    </Button>
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        )}
      </PageContainer>
    </>
  );
}