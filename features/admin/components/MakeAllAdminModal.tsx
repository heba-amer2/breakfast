import React from "react";
import { UseFormRegister } from "react-hook-form";
import { FiAlertTriangle } from "react-icons/fi";
import { Button } from "@/components/ui/button";

interface MakeAllAdminModalProps {
  isOpen: boolean;
  userCount: number;
  confirmText: string;
  registerConfirm: UseFormRegister<{ confirmText: string }>;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function MakeAllAdminModal({
  isOpen,
  userCount,
  confirmText,
  registerConfirm,
  isSubmitting,
  onClose,
  onConfirm,
}: MakeAllAdminModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <FiAlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Grant Administrator Role to All Users?
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              This will grant full administrative privileges (room creation, receipt
              entry, bill approval, and user management) to all {userCount} registered
              accounts.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900">
          To confirm this operation, type <strong>CONFIRM</strong> below:
        </div>

        <input
          type="text"
          {...registerConfirm("confirmText")}
          placeholder='Type "CONFIRM"'
          className="mt-3 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold tracking-wider text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
        />

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            className="sm:w-auto"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            fullWidth
            className="sm:w-auto"
            onClick={onConfirm}
            disabled={
              confirmText.trim().toUpperCase() !== "CONFIRM" || isSubmitting
            }
          >
            {isSubmitting ? "Promoting…" : "Confirm & Promote All"}
          </Button>
        </div>
      </div>
    </div>
  );
}

