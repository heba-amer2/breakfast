"use client";

import type {
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormRegister,
} from "react-hook-form";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { LuUtensils } from "react-icons/lu";

import { Button } from "@/components/ui";

export type OpenRoomFormValues = {
  restaurantId: string;
  restaurantName: string;
  restaurantPhone: string;
  description: string;
  initialMenu: Array<{
    name: string;
    price: string;
  }>;
};

type NewRestaurantMenuFieldsProps = {
  fields: FieldArrayWithId<OpenRoomFormValues, "initialMenu", "id">[];
  append: UseFieldArrayAppend<OpenRoomFormValues, "initialMenu">;
  remove: UseFieldArrayRemove;
  register: UseFormRegister<OpenRoomFormValues>;
  errors: FieldErrors<OpenRoomFormValues>;
};

export function NewRestaurantMenuFields({
  fields,
  append,
  remove,
  register,
  errors,
}: NewRestaurantMenuFieldsProps) {
  return (
    <div className="pt-2 border-t border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <div>
          <label className="block text-sm font-semibold text-slate-900">
            Initial Menu Items (optional)
          </label>
          <p className="text-xs text-slate-500 mt-0.5">
            Add starting dishes with prices so team members can order them immediately.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => append({ name: "", price: "" })}
          className="cursor-pointer shrink-0"
        >
          <span className="inline-flex items-center gap-1.5 text-xs">
            <FiPlus size={13} />
            + Add item
          </span>
        </Button>
      </div>

      <div className="space-y-3">
        {fields.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <LuUtensils size={18} />
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-700">
              No menu items added yet
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
              You can also open the room with 0 items; participants can type custom dishes, or you can add verified menu items later.
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => append({ name: "", price: "" })}
              className="mt-3 cursor-pointer"
            >
              <span className="inline-flex items-center gap-1 text-xs">
                <FiPlus size={12} />
                Add first dish
              </span>
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Dish #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 p-1 cursor-pointer font-medium"
                    title="Remove item"
                  >
                    <FiTrash2 size={13} />
                    <span>Remove</span>
                  </button>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-[1.5fr_1fr]">
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
  );
}

