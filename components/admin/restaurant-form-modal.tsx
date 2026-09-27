"use client";

import { useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/features/shared/store/hooks";
import { createAdminRestaurant } from "@/features/restaurants/store/restaurantThunks";
import type { RestaurantResponse, MenuItemDto } from "@/features/restaurants/store/restaurantSlice";

type InitialItem = {
  id: string;
  name: string;
  price: string;
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

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [initialItems, setInitialItems] = useState<InitialItem[]>([]);

  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setName("");
    setPhone("");
    setInitialItems([]);
    setNameError(null);
    setPhoneError(null);
    setServerError(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleAddItem = () => {
    setInitialItems((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, name: "", price: "" },
    ]);
  };

  const handleUpdateItem = (id: string, field: "name" | "price", val: string) => {
    setInitialItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };

  const handleRemoveItem = (id: string) => {
    setInitialItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Restaurant name is required");
      return;
    }
    if (trimmedName.length > 150) {
      setNameError("Maximum 150 characters");
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone.length > 20) {
      setPhoneError("Maximum 20 characters");
      return;
    }

    setIsSubmitting(true);

    const formattedMenu: MenuItemDto[] = initialItems
      .filter((item) => item.name.trim() && Number(item.price) > 0)
      .map((item) => ({
        name: item.name.trim(),
        verifiedPrice: Number(item.price),
      }));

    try {
      const result = await dispatch(
        createAdminRestaurant({
          name: trimmedName,
          phone: trimmedPhone || undefined,
          menu: formattedMenu,
        }),
      );

      if (createAdminRestaurant.fulfilled.match(result)) {
        handleClose();
        onSuccess(result.payload);
      } else {
        const err = (result.payload as string) || "Failed to create restaurant";
        setServerError(err);
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      closeOnBackdropClick={false}
      closeOnEscape={false}
      title="Add New Restaurant"
      description="Register a new restaurant partner. You can also specify its starting verified menu items."
      maxWidth="lg"
    >
      <form
        onSubmit={handleSubmit}
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

        {/* Restaurant Name */}
        <div className="w-full">
          <label
            htmlFor="restaurant-name"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            Restaurant Name *
          </label>
          <input
            id="restaurant-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder="e.g. Felfela, Zooba, El Shabrawy"
            maxLength={150}
            disabled={isSubmitting}
            className={`h-11 w-full rounded-xl border bg-white px-3.5 text-base sm:text-sm text-slate-900 shadow-2xs outline-none transition-all duration-150 touch-manipulation placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15 focus:bg-white ${
              nameError
                ? "border-rose-300 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-rose-500/15"
                : "border-slate-200/90 hover:border-slate-300"
            }`}
          />
          {nameError ? (
            <p className="mt-1 text-xs font-medium text-rose-600">{nameError}</p>
          ) : null}
        </div>

        {/* Contact Telephone */}
        <div className="w-full">
          <label
            htmlFor="restaurant-phone"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            Contact Telephone (Optional)
          </label>
          <input
            id="restaurant-phone"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (phoneError) setPhoneError(null);
            }}
            placeholder="e.g. 0223922833 or 01012345678"
            maxLength={20}
            disabled={isSubmitting}
            className={`h-11 w-full rounded-xl border bg-white px-3.5 text-base sm:text-sm text-slate-900 shadow-2xs outline-none transition-all duration-150 touch-manipulation placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15 focus:bg-white ${
              phoneError
                ? "border-rose-300 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-rose-500/15"
                : "border-slate-200/90 hover:border-slate-300"
            }`}
          />
          {phoneError ? (
            <p className="mt-1 text-xs font-medium text-rose-600">{phoneError}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">
              Direct phone line used for placing office phone orders.
            </p>
          )}
        </div>

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
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 hover:border-emerald-200 transition cursor-pointer"
            >
              <FiPlus size={13} />
              <span>Add Dish</span>
            </button>
          </div>

          {initialItems.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              No starting dishes added. You can add menu items at any time.
            </p>
          ) : (
            <div className="space-y-2 mt-3 max-h-48 overflow-y-auto pr-1">
              {initialItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-xl bg-white p-2 border border-slate-200/60 sm:border-0 sm:p-0 sm:bg-transparent"
                >
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder="Dish Name (e.g. Foul Mudammas)"
                      maxLength={150}
                      value={item.name}
                      onChange={(e) =>
                        handleUpdateItem(item.id, "name", e.target.value)
                      }
                      className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-base sm:text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 touch-manipulation"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-full sm:w-28 flex-1 sm:flex-none">
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="100000"
                        placeholder="Price in EGP"
                        value={item.price}
                        onChange={(e) =>
                          handleUpdateItem(item.id, "price", e.target.value)
                        }
                        className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-base sm:text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 touch-manipulation"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label="Remove initial dish"
                      className="p-2 text-slate-400 hover:text-rose-600 transition cursor-pointer shrink-0"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
            {isSubmitting ? "Creating Restaurant…" : "Save Restaurant"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export default RestaurantFormModal;
