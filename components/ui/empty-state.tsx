import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  icon,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 bg-linear-to-b from-white to-slate-50/50 px-6 py-12 text-center transition-all ${className}`}
    >
      {icon ? (
        <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100/80 text-slate-400 shadow-2xs ring-1 ring-slate-200/60">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-slate-500 leading-relaxed">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
