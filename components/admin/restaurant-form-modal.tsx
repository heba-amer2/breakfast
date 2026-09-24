"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { FiPlus, FiTrash2 } from "react-icons/fi";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch } from "@/features/shared/store/hooks";
import { createAdminRestaurant } from "@/features/restaurants/store/restaurantThunks";
import type { RestaurantResponse, MenuItemDto } from "@/features/restaurants/store/restaurantSlice";

type RestaurantFormValues = {
  name: string;
  phone: string;
  initialItems: Array<{
    name: string;
    price: string;
  }>;
};

type RestaurantFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (restaurant: RestaurantResponse) => void;
};

export function RestaurantFormModal({
  isOpen,
  onClose,
  onSuccess,
}: RestaurantFormModalProps) {
  const dispatch = useAppDispatch();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RestaurantFormValues>({
    defaultValues: {
      name: "",
      phone: "",
      initialItems: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "initialItems",
  });

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = async (values: RestaurantFormValues) => {
    setServerError(null);

    const formattedMenu: MenuItemDto[] = values.initialItems
      .filter((item) => item.name.trim() && Number(item.price) > 0)
      .map((item) => ({
        name: item.name.trim(),
        verifiedPrice: Number(item.price),
      }));

    const result = await dispatch(
      createAdminRestaurant({
        name: values.name.trim(),
        phone: values.phone.trim() || undefined,
        menu: formattedMenu,
      }),
    );

    if (createAdminRestaurant.fulfilled.match(result)) {
      reset();
      onSuccess(result.payload);
      onClose();
    } else {
      const err = (result.payload as string) || "Failed to create restaurant";
      setServerError(err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Restaurant"
      description="Register a new restaurant partner. You can also specify its starting verified menu items."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {serverError}
          </div>
        ) : null}

        <Input
          label="Restaurant Name *"
          placeholder="e.g. Felfela, Zooba, El Shabrawy"
          maxLength={150}
          {...register("name", {
            required: "Restaurant name is required",
            maxLength: {
              value: 150,
              message: "Maximum 150 characters",
            },
            validate: (v) =>
              Boolean(v?.trim()) || "Restaurant name cannot be blank",
          })}
          error={errors.name?.message}
          disabled={isSubmitting}
        />

        <Input
          label="Contact Telephone (Optional)"
          placeholder="e.g. 0223922833 or 01012345678"
          maxLength={20}
          {...register("phone", {
            maxLength: {
              value: 20,
              message: "Maximum 20 characters",
            },
          })}
          error={errors.phone?.message}
          disabled={isSubmitting}
          hint="Direct phone line used for placing office phone orders."
        />

        {/* Optional Starting Menu Items */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Initial Verified Menu (Optional)
              </h4>
              <p className="text-[11px] text-slate-500">
                You can add dishes now or add them later after creating the restaurant.
              </p>
            </div>
            <button
              type="button"
              onClick={() => append({ name: "", price: "" })}
              className="inline-flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 hover:border-emerald-200 transition cursor-pointer"
            >
              <FiPlus size={13} />
              <span>Add Dish</span>
            </button>
          </div>

          {fields.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              No starting dishes added. You can add menu items at any time.
            </p>
          ) : (
            <div className="space-y-2 mt-3 max-h-48 overflow-y-auto pr-1">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="flex-1">
                    <input
                      placeholder="Dish Name (e.g. Foul Mudammas)"
                      maxLength={150}
                      className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                      {...register(`initialItems.${index}.name` as const, {
                        required: "Name is required",
                      })}
                    />
                  </div>
                  <div className="w-28">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="100000"
                      placeholder="Price in EGP"
                      className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                      {...register(`initialItems.${index}.price` as const, {
                        required: "Price is required",
                      })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label="Remove initial dish"
                    className="p-2 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Restaurant…" : "Save Restaurant"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export default RestaurantFormModal;

