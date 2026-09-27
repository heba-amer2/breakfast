"use client";

import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 w-full overflow-x-clip min-w-0">
      <AdminSidebar />
      <div className="lg:pl-64 w-full min-w-0">
        <div className="min-h-screen w-full min-w-0">{children}</div>
      </div>
    </div>
  );
}
