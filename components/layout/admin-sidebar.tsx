"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiArrowRight,
  FiCheckSquare,
  FiCoffee,
  FiGrid,
  FiHome,
  FiLogOut,
  FiPlusCircle,
  FiShield,
  FiUsers,
} from "react-icons/fi";

import { NavLink } from "@/components/layout/nav-link";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { logout } from "@/features/auth/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";

const opsNav = [
  { href: "/admin/admin-dashboard", label: "Overview", icon: FiHome },
  { href: "/admin/open-new-room", label: "Open Room", icon: FiPlusCircle },
  { href: "/admin/approval-queue", label: "Approvals & Receipts", icon: FiCheckSquare },
];

const mgmtNav = [
  { href: "/admin/restaurants", label: "Restaurants & Menus", icon: FiCoffee },
  { href: "/admin/users-management", label: "Team & Roles", icon: FiUsers },
];

export function AdminSidebar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const pending = useAppSelector((state) => state.admin.pendingRooms);
  const unapproved = useAppSelector((state) => state.admin.unapprovedRooms);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/authentication/login");
      return;
    }
    if (user.role !== "ADMIN") {
      router.replace("/user/dashboard");
    }
  }, [user, router]);

  const handleLogout = () => {
    dispatch(logout());
    router.replace("/authentication/login");
  };

  const close = () => setOpen(false);

  const pendingCount = pending.length + unapproved.length;
  const adminInitials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "AD";

  const content = (
    <div className="flex h-full flex-col bg-white">
      {/* Admin Branding Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
          <FiShield size={20} className="text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-base font-bold text-slate-900 tracking-tight">
              Admin Console
            </p>
          </div>
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
            Office Management
          </p>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="px-3.5 pt-4 pb-1">
        <Link
          href="/admin/open-new-room"
          onClick={close}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-xs shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-98"
        >
          <FiPlusCircle size={15} />
          <span>Open New Breakfast Room</span>
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 px-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Room Operations
        </p>
        {opsNav.map((item) => (
          <div key={item.href} className="relative">
            <NavLink {...item} onNavigate={close} variant="admin" />
            {item.href === "/admin/approval-queue" && pendingCount > 0 ? (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            ) : null}
          </div>
        ))}

        <p className="mb-2 mt-5 px-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Directory & Team
        </p>
        {mgmtNav.map((item) => (
          <NavLink key={item.href} {...item} onNavigate={close} variant="admin" />
        ))}

        <p className="mb-2 mt-5 px-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Ordering Portal
        </p>
        <Link
          href="/user/dashboard"
          onClick={close}
          className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-900"
        >
          <span className="inline-flex items-center gap-2">
            <FiGrid size={15} className="text-slate-400 group-hover:text-emerald-600" />
            Switch to User App
          </span>
          <FiArrowRight size={13} className="text-slate-400 group-hover:text-emerald-600" />
        </Link>
      </nav>

      {/* Admin Profile Footer */}
      <div className="border-t border-slate-100 p-3.5">
        <div className="mb-2.5 flex items-center gap-3 rounded-xl bg-slate-900 p-2.5 text-white shadow-xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white shadow-2xs">
            {adminInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">
              {user?.name ?? "Office Admin"}
            </p>
            <p className="truncate text-[11px] text-slate-400">{user?.phone}</p>
          </div>
          <span className="inline-flex rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
            ADMIN
          </span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-transparent px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 cursor-pointer active:scale-98"
        >
          <FiLogOut size={14} />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <SidebarShell
      open={open}
      onOpen={() => setOpen(true)}
      onClose={close}
      menuAriaLabel="Open admin menu"
      closeOverlayAriaLabel="Close admin menu overlay"
    >
      {content}
    </SidebarShell>
  );
}
