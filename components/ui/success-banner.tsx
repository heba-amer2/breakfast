"use client";

import type { ReactNode } from "react";
import { FiCheckCircle } from "react-icons/fi";

type SuccessBannerProps = {
  children: ReactNode;
  className?: string;
  icon?: boolean | ReactNode;
};

const DEFAULT_CLASS =
  "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800";

export function SuccessBanner({
  children,
  className = DEFAULT_CLASS,
  icon = false,
}: SuccessBannerProps) {
  if (!children) return null;

  const iconNode =
    icon === true ? (
      <FiCheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
    ) : icon === false ? null : (
      icon
    );

  if (!iconNode) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      <div className="flex items-start gap-2.5">
        {iconNode}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
