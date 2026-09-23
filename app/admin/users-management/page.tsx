"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCheckCircle,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUser,
  FiUserMinus,
  FiUserPlus,
  FiUsers,
  FiX,
} from "react-icons/fi";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  demoteUser,
  fetchUsers,
  makeAllUsersAdmin,
  promoteUser,
} from "@/features/admin/store/adminThunks";
import type { UserResponse } from "@/features/admin/store/adminSlice";
import { useAuthFetch } from "@/features/shared/hooks/useAuthFetch";
import { useAppDispatch, useAppSelector } from "@/features/shared/store/hooks";

type RoleFilter = "ALL" | "ADMIN" | "USER";

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "U";
}

export default function UsersManagementPage() {
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.admin.users);
  const error = useAppSelector((state) => state.admin.error);
  const currentUser = useAppSelector((state) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [showMakeAllModal, setShowMakeAllModal] = useState(false);
  const { register: registerConfirm, watch: watchConfirm, reset: resetConfirm } = useForm<{
    confirmText: string;
  }>({
    defaultValues: { confirmText: "" },
  });
  const confirmText = watchConfirm("confirmText") ?? "";
  const [makingAllAdmin, setMakingAllAdmin] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadData = async () => {
    setLoading(true);
    await dispatch(fetchUsers());
    setLoading(false);
  };

  useAuthFetch(async () => {
    await loadData();
  });

  const adminCount = useMemo(
    () => users.filter((u) => u.role === "ADMIN").length,
    [users],
  );
  const userCount = useMemo(
    () => users.filter((u) => u.role === "USER").length,
    [users],
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole =
        roleFilter === "ALL" ? true : u.role === roleFilter;
      const matchesSearch = query
        ? u.name.toLowerCase().includes(query) ||
          (u.phone ?? "").toLowerCase().includes(query)
        : true;
      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, search]);

  const handlePromote = async (user: UserResponse) => {
    setActionInProgress(user.id);
    setFeedback(null);
    try {
      const res = await dispatch(promoteUser(user.id));
      if (promoteUser.fulfilled.match(res)) {
        setFeedback({
          type: "success",
          message: `Successfully promoted ${user.name} to Administrator.`,
        });
        await dispatch(fetchUsers());
      } else {
        setFeedback({
          type: "error",
          message:
            typeof res.payload === "string"
              ? res.payload
              : `Failed to promote ${user.name}.`,
        });
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDemote = async (user: UserResponse) => {
    setActionInProgress(user.id);
    setFeedback(null);
    try {
      const res = await dispatch(demoteUser(user.id));
      if (demoteUser.fulfilled.match(res)) {
        setFeedback({
          type: "success",
          message: `Successfully changed ${user.name}'s role to standard User.`,
        });
        await dispatch(fetchUsers());
      } else {
        setFeedback({
          type: "error",
          message:
            typeof res.payload === "string"
              ? res.payload
              : `Failed to demote ${user.name}.`,
        });
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const handleMakeAllAdmin = async () => {
    if (confirmText.trim().toUpperCase() !== "CONFIRM") return;
    setMakingAllAdmin(true);
    setFeedback(null);
    try {
      const res = await dispatch(makeAllUsersAdmin("CONFIRM"));
      if (makeAllUsersAdmin.fulfilled.match(res)) {
        setFeedback({
          type: "success",
          message: "All users have been granted Administrator permissions.",
        });
        setShowMakeAllModal(false);
        resetConfirm();
        await dispatch(fetchUsers());
      } else {
        setFeedback({
          type: "error",
          message:
            typeof res.payload === "string"
              ? res.payload
              : "Failed to promote all users.",
        });
      }
    } finally {
      setMakingAllAdmin(false);
    }
  };

  return (
    <>
      <TopBar
        title="User Access Control"
        subtitle="Review team members, assign administrator privileges, and audit role permissions."
        tag="ADMIN OPS"
        badge={
          users.length > 0
            ? `${users.length} member${users.length === 1 ? "" : "s"}`
            : undefined
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadData()}
            disabled={loading}
          >
            <span className="inline-flex items-center gap-1.5">
              <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </span>
          </Button>
        }
      />

      <PageContainer>
        {/* Alerts & Feedback */}
        {feedback ? (
          <div
            className={`mb-6 flex items-center justify-between rounded-2xl border p-4 text-sm shadow-sm transition ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50/90 text-emerald-800"
                : "border-rose-200 bg-rose-50/90 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === "success" ? (
                <FiCheckCircle size={18} className="shrink-0 text-emerald-600" />
              ) : (
                <FiAlertCircle size={18} className="shrink-0 text-rose-600" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <FiX size={16} />
            </button>
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800 shadow-sm">
            {error}
          </div>
        ) : null}

        {/* KPI Strip */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Accounts
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                  {loading ? "—" : users.length}
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

        {/* Controls: Search, Filters & Mass Promotion */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1">
              <button
                type="button"
                onClick={() => setRoleFilter("ALL")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  roleFilter === "ALL"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("ADMIN")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  roleFilter === "ADMIN"
                    ? "bg-white text-emerald-700 shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Admins ({adminCount})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("USER")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  roleFilter === "USER"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Standard ({userCount})
              </button>
            </div>

            {/* Mass Promotion Safety Trigger */}
            <div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowMakeAllModal(true)}
              >
                <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold">
                  <FiAlertTriangle size={14} />
                  Make All Users Admin…
                </span>
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <FiSearch
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name or phone number…"
              className="h-10 w-full rounded-xl border border-slate-200/80 bg-slate-50/50 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        {/* User Roster Table */}
        {loading ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <EmptyState
              title={search ? "No matching accounts" : "No users found"}
              description={
                search
                  ? `No user accounts match "${search}". Try checking the spelling or phone number.`
                  : "No users exist in this category yet."
              }
              action={
                search ? (
                  <Button variant="secondary" size="sm" onClick={() => setSearch("")}>
                    Clear search
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-5 py-3.5">Contact Phone</th>
                    <th className="px-5 py-3.5">Assigned Role</th>
                    <th className="px-5 py-3.5 text-right">Access Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const isAdmin = user.role === "ADMIN";
                    const isSelf = currentUser?.userId === user.id;
                    const isBusy = actionInProgress === user.id;
                    const initials = getInitials(user.name);

                    return (
                      <tr
                        key={user.id}
                        className={`group transition hover:bg-slate-50/80 ${
                          isSelf ? "bg-emerald-50/30" : ""
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-xs ${
                                isAdmin
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {initials}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-slate-900">
                                  {user.name}
                                </p>
                                {isSelf ? (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                                    You
                                  </span>
                                ) : null}
                              </div>
                              <span className="text-xs text-slate-400">
                                User #{user.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {user.phone ? (
                            <a
                              href={`tel:${user.phone}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              <FiPhone size={12} className="text-slate-400" />
                              {user.phone}
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              No phone registered
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {isAdmin ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                              <FiShield size={13} className="text-emerald-600" />
                              Administrator
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              <FiUser size={13} className="text-slate-400" />
                              Standard User
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isAdmin ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleDemote(user)}
                                disabled={isBusy || isSelf}
                                title={
                                  isSelf
                                    ? "You cannot demote your own account"
                                    : "Revoke admin privileges"
                                }
                              >
                                <span className="inline-flex items-center gap-1 text-xs text-rose-700">
                                  <FiUserMinus size={13} />
                                  {isBusy ? "Updating…" : "Demote to User"}
                                </span>
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handlePromote(user)}
                                disabled={isBusy}
                              >
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                                  <FiUserPlus size={13} />
                                  {isBusy ? "Updating…" : "Promote to Admin"}
                                </span>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Make All Admin Confirmation Modal */}
        {showMakeAllModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <FiAlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Grant Administrator Role to All Users?
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    This will grant full administrative privileges (room creation, receipt
                    entry, bill approval, and user management) to all {users.length} registered
                    accounts.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900">
                To confirm this operation, type <strong>CONFIRM</strong> below:
              </div>

              <input
                type="text"
                {...registerConfirm("confirmText")}
                placeholder='Type "CONFIRM"'
                className="mt-3 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold tracking-wider text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />

              <div className="mt-6 flex items-center justify-end gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowMakeAllModal(false);
                    resetConfirm();
                  }}
                  disabled={makingAllAdmin}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleMakeAllAdmin}
                  disabled={
                    confirmText.trim().toUpperCase() !== "CONFIRM" ||
                    makingAllAdmin
                  }
                >
                  {makingAllAdmin ? "Promoting…" : "Confirm & Promote All"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </PageContainer>
    </>
  );
}
