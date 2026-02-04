"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Car, Users, FolderKanban, Route, ClipboardList, ArrowRight, Plus, FileText, Calculator } from "lucide-react";
import Link from "next/link";

async function fetchDashboardStats() {
  const res = await fetch("/api/dashboard/stats");
  if (!res.ok) throw new Error("İstatistikler yüklenemedi");
  return res.json();
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  });

  const cards = [
    { title: "Projeler", value: stats?.projects ?? 0, icon: FolderKanban, gradient: "from-blue-500 to-blue-600", lightBg: "bg-blue-50", href: "/projeler" },
    { title: "Tedarikçiler", value: stats?.suppliers ?? 0, icon: Building2, gradient: "from-emerald-500 to-emerald-600", lightBg: "bg-emerald-50", href: "/tedarikciler" },
    { title: "Araçlar", value: stats?.vehicles ?? 0, icon: Car, gradient: "from-orange-500 to-orange-600", lightBg: "bg-orange-50", href: "/araclar" },
    { title: "Şoförler", value: stats?.drivers ?? 0, icon: Users, gradient: "from-purple-500 to-purple-600", lightBg: "bg-purple-50", href: "/soforler" },
    { title: "Güzergahlar", value: stats?.routes ?? 0, icon: Route, gradient: "from-pink-500 to-pink-600", lightBg: "bg-pink-50", href: "/projeler" },
    { title: "Puantajlar", value: stats?.timesheets ?? 0, icon: ClipboardList, gradient: "from-indigo-500 to-indigo-600", lightBg: "bg-indigo-50", href: "/puantaj" },
  ];

  const quickActions = [
    { title: "Yeni Proje", description: "Yeni bir proje oluşturun", href: "/projeler/yeni", icon: FolderKanban, gradient: "from-blue-500 to-indigo-500" },
    { title: "Araç Ekle", description: "Yeni bir araç kaydı oluşturun", href: "/araclar/yeni", icon: Car, gradient: "from-orange-500 to-red-500" },
    { title: "Puantaj Gir", description: "Puantaj girişi yapın", href: "/puantaj", icon: Calculator, gradient: "from-purple-500 to-pink-500" },
    { title: "Rapor Oluştur", description: "Tedarikçi raporu oluşturun", href: "/raporlar", icon: FileText, gradient: "from-emerald-500 to-teal-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Hoş Geldiniz 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Servis taşımacılığı yönetim sistemi dashboard&apos;ına hoş geldiniz
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link 
              key={card.title} 
              href={card.href}
              className="animate-fade-in-up block"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer dark:bg-slate-800/50 dark:border-slate-700/50">
                {/* Gradient accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
                
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {card.title}
                  </CardTitle>
                  <div className={`p-3 rounded-xl ${card.lightBg} dark:bg-slate-700/50 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-5 h-5 bg-gradient-to-r ${card.gradient} bg-clip-text`} style={{ color: card.gradient.includes('blue') ? '#3b82f6' : card.gradient.includes('emerald') ? '#10b981' : card.gradient.includes('orange') ? '#f97316' : card.gradient.includes('purple') ? '#a855f7' : card.gradient.includes('pink') ? '#ec4899' : '#6366f1' }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div className="text-4xl font-bold text-slate-900 dark:text-white">
                      {isLoading ? (
                        <div className="h-10 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      ) : (
                        card.value
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in-up animation-delay-400">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Hızlı İşlemler</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="group relative block p-5 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${500 + index * 100}ms` }}
              >
                {/* Hover gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} mb-4 group-hover:bg-white/20 transition-colors duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-white transition-colors duration-300">
                    {action.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 group-hover:text-white/80 transition-colors duration-300">
                    {action.description}
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-sm font-medium text-slate-400 group-hover:text-white transition-colors duration-300">
                    <Plus className="w-4 h-4" />
                    <span>Başla</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="animate-fade-in-up animation-delay-600">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-2">UZHAN ERP - Milenyum Lite</h3>
            <p className="text-blue-100 max-w-xl">
              Servis taşımacılığı operasyonlarınızı tek bir platformdan yönetin. 
              Projeler, araçlar, şoförler ve puantaj işlemlerinizi kolayca takip edin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
