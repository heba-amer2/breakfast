"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";

export type NavLinkVariant = "user" | "admin";

type NavLinkProps = {
  href: string;
  label: string;
  icon: IconType;
  onNavigate?: () => void;
  variant?: NavLinkVariant;
};

export function NavLink({
  href,
  label,
  icon: Icon,
  onNavigate,
  variant = "user",
}: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  const activeClasses =
    variant === "admin"
      ? "bg-slate-900 text-white font-semibold shadow-xs"
      : "bg-emerald-50 text-emerald-800 font-semibold shadow-2xs";

  const inactiveClasses =
    variant === "admin"
      ? "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900"
      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900";

  const activeIconClass =
    variant === "admin" ? "text-emerald-400" : "text-emerald-600";

  const indicatorClass =
    variant === "admin" ? "bg-emerald-500" : "bg-emerald-600";

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={[
        "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 select-none",
        variant === "user" ? "min-h-[40px]" : "",
        active ? activeClasses : inactiveClasses,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {active ? (
        <span
          className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${indicatorClass}`}
          aria-hidden
        />
      ) : null}
      <Icon
        size={18}
        className={
          active
            ? activeIconClass
            : "text-slate-400 transition-colors group-hover:text-slate-600"
        }
      />
      <span>{label}</span>
    </Link>
  );
}
