"use client";

import type { ReactNode } from "react";
import { FiX } from "react-icons/fi";

type ErrorBannerProps = {
  children: ReactNode;
  className?: string;
  onDismiss?: () => void;
  dismissLabel?: string;
};

/** Default style matching the most common page-level error banner. */
export const ERROR_BANNER_CLASS =
  "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700";

export function ErrorBanner({
  children,
  className = ERROR_BANNER_CLASS,
  onDismiss,
  dismissLabel = "Dismiss error",
}: ErrorBannerProps) {
  if (!children) return null;

  if (!onDismiss) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">{children}</div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="shrink-0 rounded-lg p-1 text-rose-400 transition hover:bg-rose-100 hover:text-rose-700 cursor-pointer"
        >
          <FiX size={16} />
        </button>
      </div>
    </div>
  );
}
