"use client";

import { useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/formatters";
import { useAppDispatch } from "@/features/shared/store/hooks";
import { deleteMenuItem } from "@/features/restaurants/store/restaurantThunks";
import type { MenuItemDto } from "@/features/restaurants/store/restaurantSlice";

type DeleteMenuItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: number;
  item: MenuItemDto | null;
  onSuccess: () => void;
};

export function DeleteMenuItemModal({
  isOpen,
  onClose,
  restaurantId,
  item,
  onSuccess,
}: DeleteMenuItemModalProps) {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!item) return null;

  const handleDelete = async () => {
    if (!item.id) {
      setError("Cannot delete item without an ID.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await dispatch(
      deleteMenuItem({
        restaurantId,
        menuItemId: item.id,
      }),
    );

    setLoading(false);

    if (deleteMenuItem.fulfilled.match(result)) {
      onSuccess();
      onClose();
    } else {
      const err = (result.payload as string) || "Failed to remove menu item";
      setError(err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Remove Menu Item"
      maxWidth="sm"
    >
      <div className="space-y-4">
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <FiAlertTriangle size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Are you sure you want to remove this menu item?
            </p>
            <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs">
              <p className="font-bold text-slate-900">{item.name}</p>
              <p className="text-slate-500 mt-0.5">
                Verified Price:{" "}
                <span className="font-bold text-emerald-800">
                  {formatMoney(item.verifiedPrice)}
                </span>
              </p>
            </div>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              This dish will be removed from the restaurant&apos;s verified catalog.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Removing…" : "Remove Menu Item"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
export default DeleteMenuItemModal;
