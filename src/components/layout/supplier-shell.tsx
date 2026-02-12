"use client";

import { SupplierSidebar } from "@/components/layout/supplier-sidebar";
import { useSidebar } from "@/components/layout/sidebar-provider";
import { Button } from "@/components/ui/button";
import { Menu, Truck } from "lucide-react";

export function SupplierShell({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useSidebar();

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-green-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-50 flex flex-col w-72
          bg-gradient-to-b from-emerald-900 via-emerald-900 to-emerald-800 text-white
          transform transition-transform duration-300 ease-in-out
          md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <SupplierSidebar onNavigate={() => setOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-background">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            aria-label="Menüyü aç"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-foreground">Tedarikçi Portalı</span>
          </div>
          <div className="w-10" />
        </header>

        <main className="flex-1 overflow-y-auto relative">
          <div
            className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative p-4 sm:p-6 lg:p-8 min-h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
