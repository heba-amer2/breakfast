"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";

const emptySubscribe = () => () => {};
const useMounted = () => useSyncExternalStore(emptySubscribe, () => true, () => false);

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  className?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
};

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
  className = "",
  closeOnBackdropClick = false,
  closeOnEscape = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const mounted = useMounted();

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Safe Escape key handler
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Never close if user is focused inside an input, textarea, or select
        const activeTag = document.activeElement?.tagName?.toUpperCase();
        if (
          activeTag === "INPUT" ||
          activeTag === "TEXTAREA" ||
          activeTag === "SELECT"
        ) {
          return;
        }
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-0 bg-slate-900/60 transition-opacity duration-200 ${
          closeOnBackdropClick ? "cursor-pointer" : ""
        }`}
        onClick={closeOnBackdropClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Centering wrapper */}
      <div
        className="relative z-10 flex min-h-full items-start sm:items-center justify-center p-3 sm:p-6 my-auto"
        onClick={(e) => {
          if (closeOnBackdropClick && e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Modal Surface */}
        <div
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          className={`w-full ${maxWidthClasses[maxWidth]} max-h-[88dvh] max-h-[88vh] overflow-y-auto rounded-3xl border border-slate-200/90 bg-white p-4.5 sm:p-6 shadow-xl transition-all duration-200 ${className}`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3">
            <div>
              {title ? (
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              ) : null}
              {description ? (
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  {description}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="mt-2">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
export default Modal;
