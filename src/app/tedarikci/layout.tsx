import { SupplierShell } from "@/components/layout/supplier-shell";
import { SidebarProvider } from "@/components/layout/sidebar-provider";

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <SupplierShell>{children}</SupplierShell>
    </SidebarProvider>
  );
}
