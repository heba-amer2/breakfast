"use client";

import type { ReactNode } from "react";
import { FiMenu, FiX } from "react-icons/fi";

type SidebarShellProps = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  children: ReactNode;
  menuAriaLabel: string;
  closeOverlayAriaLabel: string;
};


export function SidebarShell({
  open,
  onOpen,
  onClose,
  children,
  menuAriaLabel,
  closeOverlayAriaLabel,
}: SidebarShellProps) {
  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-3.5 sm:top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer lg:hidden"
        onClick={onOpen}
        aria-label={menuAriaLabel}
      >
        <FiMenu size={18} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            aria-label={closeOverlayAriaLabel}
            onClick={onClose}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl transition-transform">
            <button
              type="button"
              className="absolute right-3.5 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              onClick={onClose}
              aria-label="Close menu"
            >
              <FiX size={18} />
            </button>
            {children}
          </aside>
        </div>
      ) : null}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200/90 bg-white shadow-2xs lg:block">
        {children}
      </aside>
    </>
  );
}
