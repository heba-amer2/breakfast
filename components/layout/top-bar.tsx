"use client";

import type { ReactNode } from "react";

type TopBarProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  badge?: ReactNode;
  tag?: string;
};

export function TopBar({
  title,
  subtitle,
  actions,
  badge,
  tag = "Overview",
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md shadow-2xs transition-all">
      <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="pl-12 lg:pl-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50/90 px-2 py-0.5 rounded-md border border-emerald-200/70">
              {tag}
            </span>
            {badge ? <div className="inline-flex">{badge}</div> : null}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl mt-0.5">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500 leading-snug">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 sm:self-center">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
