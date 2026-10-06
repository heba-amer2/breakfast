import React from "react";
import { FiPhone, FiShield, FiUser, FiUserPlus, FiUserMinus } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { UserResponse } from "@/features/admin/store/adminSlice";

interface UsersManagementTableProps {
  loading: boolean;
  users: UserResponse[];
  currentUserId?: number;
  actionInProgress: number | null;
  search: string;
  onClearSearch: () => void;
  onPromote: (user: UserResponse) => void;
  onDemote: (user: UserResponse) => void;
  getInitials: (name: string) => string;
}

export function UsersManagementTable({
  loading,
  users,
  currentUserId,
  actionInProgress,
  search,
  onClearSearch,
  onPromote,
  onDemote,
  getInitials,
}: UsersManagementTableProps) {
  if (loading) {
    return (
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
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
              <Button variant="secondary" size="sm" onClick={onClearSearch}>
                Clear search
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full sm:min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-3 sm:px-5 py-3.5">User</th>
              <th className="hidden sm:table-cell px-5 py-3.5">Contact Phone</th>
              <th className="px-3 sm:px-5 py-3.5">Assigned Role</th>
              <th className="px-3 sm:px-5 py-3.5 text-right">Access Management</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => {
              const isAdmin = user.role === "ADMIN";
              const isSelf = currentUserId === user.id;
              const isBusy = actionInProgress === user.id;
              const initials = getInitials(user.name);

              return (
                <tr
                  key={user.id}
                  className={`group transition hover:bg-slate-50/80 ${
                    isSelf ? "bg-emerald-50/30" : ""
                  }`}
                >
                  <td className="px-3 sm:px-5 py-4">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <span
                        className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-xs ${
                          isAdmin
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 truncate">
                            {user.name}
                          </p>
                          {isSelf ? (
                            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                              You
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span>User #{user.id}</span>
                          {user.phone ? (
                            <span className="sm:hidden">
                              &middot;{" "}
                              <a
                                href={`tel:${user.phone}`}
                                className="text-emerald-600 hover:underline"
                              >
                                {user.phone}
                              </a>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="hidden sm:table-cell px-5 py-4">
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

                  <td className="px-3 sm:px-5 py-4 whitespace-nowrap">
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 sm:px-3 py-1 text-xs font-bold text-emerald-800">
                        <FiShield size={13} className="text-emerald-600" />
                        <span className="hidden sm:inline">Administrator</span>
                        <span className="sm:hidden">Admin</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 sm:px-3 py-1 text-xs font-semibold text-slate-700">
                        <FiUser size={13} className="text-slate-400" />
                        <span className="hidden sm:inline">Standard User</span>
                        <span className="sm:hidden">User</span>
                      </span>
                    )}
                  </td>

                  <td className="px-3 sm:px-5 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {isAdmin ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onDemote(user)}
                          disabled={isBusy || isSelf}
                          className="min-h-[34px] px-2.5 sm:px-3"
                          title={
                            isSelf
                              ? "You cannot demote your own account"
                              : "Revoke admin privileges"
                          }
                        >
                          <span className="inline-flex items-center gap-1 text-xs text-rose-700">
                            <FiUserMinus size={13} />
                            <span className="hidden sm:inline">
                              {isBusy ? "Updating…" : "Demote to User"}
                            </span>
                            <span className="sm:hidden">
                              {isBusy ? "…" : "Demote"}
                            </span>
                          </span>
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onPromote(user)}
                          disabled={isBusy}
                          className="min-h-[34px] px-2.5 sm:px-3"
                        >
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                            <FiUserPlus size={13} />
                            <span className="hidden sm:inline">
                              {isBusy ? "Updating…" : "Promote to Admin"}
                            </span>
                            <span className="sm:hidden">
                              {isBusy ? "…" : "Promote"}
                            </span>
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
  );
}
