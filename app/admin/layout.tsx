"use client";

import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="lg:pl-64">
        <div className="min-h-screen">{children}</div>
      </div>
    </div>
  );
}
