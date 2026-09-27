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
    <header className="sticky top-0 z-20 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xs transition-all">
      <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3.5 lg:px-8 w-full max-w-7xl mx-auto">
        <div className="min-w-0 pl-14 sm:pl-14 lg:pl-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50/90 px-2 py-0.5 rounded-md border border-emerald-200/70">
              {tag}
            </span>
            {badge ? <div className="inline-flex">{badge}</div> : null}
          </div>
          <h1 className="mt-1.5 text-lg font-bold tracking-tight text-slate-900 sm:text-2xl break-words">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-xs text-slate-500 leading-relaxed sm:text-sm">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:self-center pt-1 sm:pt-0">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
