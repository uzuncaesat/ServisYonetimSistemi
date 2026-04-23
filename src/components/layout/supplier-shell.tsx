"use client";

import { SupplierSidebar } from "@/components/layout/supplier-sidebar";
import { useSidebar } from "@/components/layout/sidebar-provider";
import { Button } from "@/components/ui/button";
import { Menu, Truck } from "lucide-react";
import { PageTransition } from "@/components/motion/page-transition";

export function SupplierShell({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useSidebar();

  return (
    <div className="flex h-screen bg-background">
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-background
          transform transition-transform duration-200 ease-out
          md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <SupplierSidebar onNavigate={() => setOpen(false)} />
      </aside>

      <div className="flex flex-1 min-w-0 flex-col">
        <header className="md:hidden flex h-14 items-center justify-between gap-2 border-b border-border bg-background px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            aria-label="Menüyü aç"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Truck className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Tedarikçi
            </span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
