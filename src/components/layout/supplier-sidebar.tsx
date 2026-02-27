"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Car,
  ClipboardList,
  LogOut,
  Truck,
  ChevronRight,
  Bell,
  FileText,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const menuItems = [
  { href: "/tedarikci", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tedarikci/araclarim", label: "Araçlarım", icon: Car },
  { href: "/tedarikci/puantaj", label: "Puantaj / Hakediş", icon: ClipboardList },
  { href: "/tedarikci/raporlar", label: "Raporlarım", icon: FileText },
  { href: "/tedarikci/bildirimler", label: "Bildirimler", icon: Bell },
];

interface SupplierSidebarProps {
  onNavigate?: () => void;
}

export function SupplierSidebar({ onNavigate }: SupplierSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-b from-emerald-900 via-emerald-900 to-emerald-800 text-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      {/* Logo */}
      <div className="relative p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
              UZHAN ERP
            </h1>
            <p className="text-xs text-emerald-300">Tedarikçi Portalı</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide relative min-h-0">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== "/tedarikci" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
                isActive
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/25"
                  : "text-emerald-200 hover:bg-white/5 hover:text-white"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
              )}
              
              <div className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300",
                isActive 
                  ? "bg-white/20" 
                  : "bg-emerald-800/50 group-hover:bg-emerald-700/50 group-hover:scale-110"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              
              <span className="font-medium flex-1">{item.label}</span>
              
              <ChevronRight className={cn(
                "w-4 h-4 transition-all duration-300 opacity-0 -translate-x-2",
                isActive ? "opacity-100 translate-x-0" : "group-hover:opacity-50 group-hover:translate-x-0"
              )} />
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="relative p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-3 mb-3 rounded-xl bg-white/5">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white font-semibold text-sm">
            {session?.user?.email?.charAt(0).toUpperCase() || "T"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-white truncate">
                {session?.user?.name || session?.user?.email?.split("@")[0] || "Tedarikçi"}
              </p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-300">
                Tedarikçi
              </span>
            </div>
            <p className="text-xs text-emerald-400 truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>
        
        <ThemeToggle className="mb-2" />
        
        <Button
          variant="ghost"
          className="w-full justify-start text-emerald-300 hover:text-white hover:bg-red-500/10 rounded-xl transition-all duration-300 group"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-800/50 group-hover:bg-red-500/20 transition-all duration-300 mr-3">
            <LogOut className="w-5 h-5 group-hover:text-red-400 transition-colors" />
          </div>
          <span className="group-hover:text-red-400 transition-colors">Çıkış Yap</span>
        </Button>
      </div>
    </div>
  );
}
