"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiArrowRight,
  FiCheckSquare,
  FiCoffee,
  FiGrid,
  FiHome,
  FiLogOut,
  FiMenu,
  FiPlusCircle,
  FiShield,
  FiUsers,
  FiX,
} from "react-icons/fi";

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

function NavLink({
  href,
  label,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof FiHome;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={[
        "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 select-none",
        active
          ? "bg-slate-900 text-white font-semibold shadow-xs"
          : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900",
      ].join(" ")}
    >
      {active ? (
        <span
          className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-500"
          aria-hidden
        />
      ) : null}
      <Icon
        size={18}
        className={
          active
            ? "text-emerald-400"
            : "text-slate-400 transition-colors group-hover:text-slate-600"
        }
      />
      <span>{label}</span>
    </Link>
  );
}

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
            <NavLink {...item} onNavigate={close} />
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
          <NavLink key={item.href} {...item} onNavigate={close} />
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
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open admin menu"
      >
        <FiMenu size={18} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            aria-label="Close admin menu overlay"
            onClick={close}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl transition-transform">
            <button
              type="button"
              className="absolute right-3.5 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              onClick={close}
              aria-label="Close menu"
            >
              <FiX size={18} />
            </button>
            {content}
          </aside>
        </div>
      ) : null}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200/90 bg-white shadow-2xs lg:block">
        {content}
      </aside>
    </>
  );
}
