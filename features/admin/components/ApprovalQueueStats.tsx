"use client";

import {
  FiCheckSquare,
  FiClock,
  FiDollarSign,
  FiFileText,
} from "react-icons/fi";

import { StatCard } from "@/components/dashboard/stat-card";
import { formatMoney } from "@/lib/formatters";

type ApprovalQueueStatsProps = {
  loading: boolean;
  unapprovedCount: number;
  pendingCount: number;
  queueTotal: number;
  awaitingValue: number;
};

export function ApprovalQueueStats({
  loading,
  unapprovedCount,
  pendingCount,
  queueTotal,
  awaitingValue,
}: ApprovalQueueStatsProps) {
  return (
    <div className="hidden sm:grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Need receipt"
        value={loading ? "—" : unapprovedCount}
        hint="Stage 1 · Paper receipt entry"
        tone="sage"
        icon={<FiFileText size={18} />}
      />
      <StatCard
        label="Need approval"
        value={loading ? "—" : pendingCount}
        hint="Stage 2 · Final bill sign-off"
        tone="forest"
        icon={<FiCheckSquare size={18} />}
      />
      <StatCard
        label="Total in queue"
        value={loading ? "—" : queueTotal}
        hint="Awaiting receipt or approval"
        tone="emerald"
        icon={<FiClock size={18} />}
      />
      <StatCard
        label="Pending value"
        value={loading ? "—" : formatMoney(awaitingValue)}
        hint="Total awaiting bill approval"
        tone="default"
        icon={<FiDollarSign size={18} />}
      />
    </div>
  );
}

