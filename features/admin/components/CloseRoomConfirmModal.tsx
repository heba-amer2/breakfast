"use client";

import type { ReactNode } from "react";
import { FiAlertTriangle, FiLock, FiRefreshCw } from "react-icons/fi";

import { Button, Modal } from "@/components/ui";

type CloseRoomConfirmModalProps = {
  isOpen: boolean;
  roomId?: number | null;
  restaurantName?: string | null;
  error?: string | null;
  isClosing: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Body copy under the description. Defaults to dashboard wording. */
  message?: ReactNode;
  /** Extra content between message and actions (e.g. consequences list). */
  extraContent?: ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
};


export function CloseRoomConfirmModal({
  isOpen,
  roomId,
  restaurantName,
  error,
  isClosing,
  onClose,
  onConfirm,
  message = (
    <p className="text-sm text-slate-600 leading-relaxed">
      Are you sure you want to manually close this room? Team members will
      immediately be blocked from adding or changing orders.
    </p>
  ),
  extraContent,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm Close",
}: CloseRoomConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isClosing) onClose();
      }}
      title={
        <div className="flex items-center gap-2 text-rose-700 font-bold">
          <FiAlertTriangle size={20} className="shrink-0" />
          <span>Close Breakfast Room #{roomId}?</span>
        </div>
      }
      description={
        restaurantName ? `Stop ordering for ${restaurantName}` : undefined
      }
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {error ? (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <FiAlertTriangle size={15} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        ) : null}

        {message}
        {extraContent}

        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isClosing}
            className="flex-1 sm:flex-none justify-center"
          >
            {cancelLabel}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isClosing}
            className="flex-1 sm:flex-none justify-center"
          >
            <span className="inline-flex items-center gap-1.5 font-bold">
              {isClosing ? (
                <>
                  <FiRefreshCw size={13} className="animate-spin" />
                  Closing…
                </>
              ) : (
                <>
                  <FiLock size={13} />
                  {confirmLabel}
                </>
              )}
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
