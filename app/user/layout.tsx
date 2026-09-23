"use client";

import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";

export default function UserShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:pl-64">
        <div className="min-h-screen">{children}</div>
      </div>
    </div>
  );
}
