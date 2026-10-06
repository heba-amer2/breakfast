"use client";

import { FiShield, FiUser, FiUsers } from "react-icons/fi";

type UsersKpiStripProps = {
  loading: boolean;
  totalCount: number;
  adminCount: number;
  userCount: number;
};

export function UsersKpiStrip({
  loading,
  totalCount,
  adminCount,
  userCount,
}: UsersKpiStripProps) {
  return (
    <div className="mb-6 hidden sm:grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Accounts
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {loading ? "—" : totalCount}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <FiUsers size={20} />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Registered office team members in the system
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Administrators
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">
              {loading ? "—" : adminCount}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <FiShield size={20} />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Can open rooms, enter receipts, and approve bills
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Team Users
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-800">
              {loading ? "—" : userCount}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <FiUser size={20} />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Standard accounts with order placement permissions
        </p>
      </div>
    </div>
  );
}

