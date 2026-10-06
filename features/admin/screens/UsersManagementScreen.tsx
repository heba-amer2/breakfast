"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCheckCircle,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";

import { PageContainer } from "@/components/layout/page-container";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { MakeAllAdminModal } from "@/features/admin/components/MakeAllAdminModal";
import { UsersKpiStrip } from "@/features/admin/components/UsersKpiStrip";
import { UsersManagementTable } from "@/features/admin/components/UsersManagementTable";
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
  const { register: registerConfirm, control: controlConfirm, reset: resetConfirm } = useForm<{
    confirmText: string;
  }>({
    defaultValues: { confirmText: "" },
  });
  const watchedConfirm = useWatch({ control: controlConfirm, name: "confirmText" });
  const confirmText = watchedConfirm ?? "";
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
            className="w-full sm:w-auto min-h-[38px] sm:min-h-[36px]"
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </span>
          </Button>
        }
      />

      <PageContainer className="space-y-4 sm:space-y-6 pb-8 sm:pb-12">
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
        <UsersKpiStrip
          loading={loading}
          totalCount={users.length}
          adminCount={adminCount}
          userCount={userCount}
        />

        {/* Controls: Search, Filters & Mass Promotion */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Role Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setRoleFilter("ALL")}
                className={`flex-1 sm:flex-none text-center rounded-lg px-3 py-1.5 text-xs font-semibold transition min-h-[36px] sm:min-h-[34px] ${
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
                className={`flex-1 sm:flex-none text-center rounded-lg px-3 py-1.5 text-xs font-semibold transition min-h-[36px] sm:min-h-[34px] ${
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
                className={`flex-1 sm:flex-none text-center rounded-lg px-3 py-1.5 text-xs font-semibold transition min-h-[36px] sm:min-h-[34px] ${
                  roleFilter === "USER"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Standard ({userCount})
              </button>
            </div>

            {/* Mass Promotion Safety Trigger */}
            <div className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                className="sm:w-auto min-h-[36px]"
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
        <UsersManagementTable
          loading={loading}
          users={filteredUsers}
          currentUserId={currentUser?.userId}
          actionInProgress={actionInProgress}
          search={search}
          onClearSearch={() => setSearch("")}
          onPromote={handlePromote}
          onDemote={handleDemote}
          getInitials={getInitials}
        />

        {/* Make All Admin Confirmation Modal */}
        <MakeAllAdminModal
          isOpen={showMakeAllModal}
          userCount={users.length}
          confirmText={confirmText}
          registerConfirm={registerConfirm}
          isSubmitting={makingAllAdmin}
          onClose={() => {
            setShowMakeAllModal(false);
            resetConfirm();
          }}
          onConfirm={handleMakeAllAdmin}
        />
      </PageContainer>
    </>
  );
}
