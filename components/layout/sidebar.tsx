"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiCoffee,
  FiCompass,
  FiGrid,
  FiHome,
  FiLogOut,
  FiMenu,
  FiShield,
  FiShoppingBag,
  FiX,
} from "react-icons/fi";

import { logout } from "@/features/auth/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";
import { isRoomActive } from "@/lib/roomUtils";

const userNav = [
  { href: "/user/dashboard", label: "Dashboard", icon: FiHome },
  { href: "/user/rooms", label: "Breakfast Rooms", icon: FiGrid },
  { href: "/user/my-orders", label: "My Orders", icon: FiShoppingBag },
  { href: "/user/restaurants", label: "Restaurants & Menus", icon: FiCoffee },
];

const adminNav = [
  { href: "/admin/admin-dashboard", label: "Admin Console", icon: FiShield },
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
          ? "bg-emerald-50 text-emerald-800 font-semibold shadow-2xs"
          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
      ].join(" ")}
    >
      {active ? (
        <span
          className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-600"
          aria-hidden
        />
      ) : null}
      <Icon
        size={18}
        className={
          active
            ? "text-emerald-600"
            : "text-slate-400 transition-colors group-hover:text-slate-600"
        }
      />
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const rooms = useAppSelector((state) => state.rooms.items);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const ticker = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  useEffect(() => {
    if (!user) {
      router.replace("/authentication/login");
    }
  }, [user, router]);

  const handleLogout = () => {
    dispatch(logout());
    router.replace("/authentication/login");
  };

  const close = () => setOpen(false);

  const openRoomsCount = rooms.filter((r) => isRoomActive(r, now)).length;
  const userInitials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const content = (
    <div className="flex h-full flex-col bg-white">
      {/* Brand Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-600 to-teal-800 text-white shadow-xs shadow-emerald-700/25">
          <FiCoffee size={20} className="stroke-[2.5]" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-slate-900 tracking-tight">
            BreakfastHub
          </p>
          <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">
            Smart Office
          </p>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 px-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          User Portal
        </p>

        {userNav.map((item) => (
          <NavLink key={item.href} {...item} onNavigate={close} />
        ))}

        {openRoomsCount > 0 ? (
          <div className="mx-2 mt-4 rounded-xl border border-emerald-100 bg-linear-to-br from-emerald-50/80 to-emerald-100/40 p-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <p className="text-xs font-semibold text-emerald-900">
                {openRoomsCount} {openRoomsCount === 1 ? "room" : "rooms"} open
              </p>
            </div>
            <p className="mt-1 text-[11px] text-emerald-700/80 leading-snug">
              Order now before timer expires!
            </p>
            <Link
              href="/user/rooms"
              onClick={close}
              className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <FiCompass size={13} />
              Join live orders &rarr;
            </Link>
          </div>
        ) : null}

        {user?.role === "ADMIN" ? (
          <>
            <p className="mb-2 mt-6 px-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Admin Shortcuts
            </p>
            {adminNav.map((item) => (
              <NavLink key={item.href} {...item} onNavigate={close} />
            ))}
          </>
        ) : null}
      </nav>

      {/* User Footer Profile */}
      <div className="border-t border-slate-100 p-3.5">
        <div className="mb-2.5 flex items-center gap-3 rounded-xl bg-slate-50/90 border border-slate-200/60 p-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-emerald-800 to-slate-900 text-xs font-bold text-white shadow-2xs">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-800">
              {user?.name ?? "Guest User"}
            </p>
            <p className="truncate text-[11px] text-slate-400">{user?.phone}</p>
          </div>
          <span className="inline-flex rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            {user?.role ?? "USER"}
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
        aria-label="Open navigation menu"
      >
        <FiMenu size={18} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            aria-label="Close menu overlay"
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
