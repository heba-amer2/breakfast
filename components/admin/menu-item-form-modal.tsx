"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch } from "@/features/shared/store/hooks";
import { upsertMenuItem } from "@/features/restaurants/store/restaurantThunks";
import type { MenuItemDto } from "@/features/restaurants/store/restaurantSlice";

type MenuItemFormValues = {
  name: string;
  price: string;
};

type MenuItemFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: number;
  item?: MenuItemDto | null;
  onSuccess: (savedItem: MenuItemDto) => void;
};

export function MenuItemFormModal({
  isOpen,
  onClose,
  restaurantId,
  item,
  onSuccess,
}: MenuItemFormModalProps) {
  const dispatch = useAppDispatch();
  const [serverError, setServerError] = useState<string | null>(null);

  const isEditing = Boolean(item);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MenuItemFormValues>({
    values: {
      name: item?.name ?? "",
      price: item ? String(item.verifiedPrice) : "",
    },
  });

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = async (values: MenuItemFormValues) => {
    setServerError(null);

    const priceNum = Number(values.price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setServerError("Please enter a valid price greater than 0");
      return;
    }

    const result = await dispatch(
      upsertMenuItem({
        restaurantId,
        name: values.name.trim(),
        price: priceNum,
      }),
    );

    if (upsertMenuItem.fulfilled.match(result)) {
      reset();
      onSuccess(result.payload);
      onClose();
    } else {
      const err = (result.payload as string) || "Failed to save menu item";
      setServerError(err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? "Update Menu Item" : "Add Menu Item"}
      description={
        isEditing
          ? `Update the verified catalog price for "${item?.name}".`
          : "Add a new dish to this restaurant's verified menu catalog."
      }
      maxWidth="md"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.target as HTMLElement)?.tagName === "INPUT") {
            e.preventDefault();
          }
        }}
        className="space-y-4"
        noValidate
      >
        {serverError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {serverError}
          </div>
        ) : null}

        <Input
          label="Item Name *"
          placeholder="e.g. Shakshuka with Feta"
          maxLength={150}
          {...register("name", {
            required: "Item name is required",
            maxLength: {
              value: 150,
              message: "Maximum 150 characters",
            },
            validate: (v) => Boolean(v?.trim()) || "Item name cannot be blank",
          })}
          error={errors.name?.message}
          disabled={isSubmitting}
        />

        <Input
          label="Verified Price (in EGP) *"
          type="number"
          step="0.5"
          min="0.5"
          max="100000"
          placeholder="0.00"
          {...register("price", {
            required: "Price is required",
            min: {
              value: 0.01,
              message: "Price must be greater than 0",
            },
            max: {
              value: 100000,
              message: "Price cannot exceed 100,000 EGP",
            },
          })}
          error={errors.price?.message}
          disabled={isSubmitting}
          hint="Price verified against physical receipts or vendor pricing."
        />

        {/* Modal Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
            fullWidth
            className="sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            fullWidth
            className="sm:w-auto"
          >
            {isSubmitting
              ? "Saving…"
              : isEditing
                ? "Update Price"
                : "Save Menu Item"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export default MenuItemFormModal;

