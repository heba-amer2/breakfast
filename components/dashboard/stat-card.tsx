import type { ReactNode } from "react";
import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";

export type StatCardTone =
  | "default"
  | "emerald"
  | "forest"
  | "sage"
  | "mint"
  | "amber"
  | "sky"
  | "indigo";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  icon?: ReactNode;
  tone?: StatCardTone;
};

const toneStyles: Record<
  StatCardTone,
  {
    card: string;
    iconBg: string;
    arrow: string;
  }
> = {
  default: {
    card: "border-slate-200/90 bg-linear-to-br from-white via-white to-slate-50/70 hover:border-emerald-300",
    iconBg: "bg-slate-100 text-slate-700 ring-slate-200/60",
    arrow: "group-hover:text-emerald-700",
  },
  emerald: {
    card: "border-emerald-200/80 bg-linear-to-br from-white via-emerald-50/30 to-emerald-50/70 hover:border-emerald-300 shadow-emerald-600/5",
    iconBg: "bg-emerald-100/90 text-emerald-800 ring-emerald-200/80",
    arrow: "group-hover:text-emerald-800",
  },
  forest: {
    card: "border-emerald-900/20 bg-linear-to-br from-white via-emerald-50/40 to-emerald-100/50 hover:border-emerald-700 shadow-emerald-900/5",
    iconBg: "bg-emerald-900 text-emerald-100 ring-emerald-800/80",
    arrow: "group-hover:text-emerald-900",
  },
  sage: {
    card: "border-emerald-100 bg-linear-to-br from-white via-slate-50/50 to-emerald-50/40 hover:border-emerald-200",
    iconBg: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    arrow: "group-hover:text-emerald-700",
  },
  mint: {
    card: "border-teal-200/60 bg-linear-to-br from-white via-teal-50/20 to-emerald-50/40 hover:border-emerald-300",
    iconBg: "bg-teal-50 text-teal-800 ring-teal-100",
    arrow: "group-hover:text-teal-800",
  },
  amber: {
    card: "border-emerald-900/20 bg-linear-to-br from-white via-emerald-50/40 to-emerald-100/50 hover:border-emerald-700 shadow-emerald-900/5",
    iconBg: "bg-emerald-900 text-emerald-100 ring-emerald-800/80",
    arrow: "group-hover:text-emerald-900",
  },
  sky: {
    card: "border-emerald-100 bg-linear-to-br from-white via-slate-50/50 to-emerald-50/40 hover:border-emerald-200",
    iconBg: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    arrow: "group-hover:text-emerald-700",
  },
  indigo: {
    card: "border-teal-200/60 bg-linear-to-br from-white via-teal-50/20 to-emerald-50/40 hover:border-emerald-300",
    iconBg: "bg-teal-50 text-teal-800 ring-teal-100",
    arrow: "group-hover:text-teal-800",
  },
};

export function StatCard({
  label,
  value,
  hint,
  href,
  icon,
  tone = "default",
}: StatCardProps) {
  const styles = toneStyles[tone] ?? toneStyles.default;

  const content = (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-5 shadow-xs transition-all duration-200 food-card-hover ${styles.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-1.5 text-3xl font-extrabold tracking-tight tabular-nums text-slate-900">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-slate-500 line-clamp-1">{hint}</p>
          ) : null}
        </div>
        {icon ? (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-2xs ring-1 ${styles.iconBg}`}
          >
            {icon}
          </div>
        ) : null}
      </div>

      {href ? (
        <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-slate-400 transition-colors">
          <span className={`text-[11px] transition-colors ${styles.arrow}`}>
            View details
          </span>
          <FiArrowUpRight
            className={`transition-all duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${styles.arrow}`}
            size={14}
          />
        </div>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
