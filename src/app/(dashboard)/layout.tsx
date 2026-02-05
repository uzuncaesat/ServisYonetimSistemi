import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SidebarProvider } from "@/components/layout/sidebar-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardShell>{children}</DashboardShell>
    </SidebarProvider>
  );
}
