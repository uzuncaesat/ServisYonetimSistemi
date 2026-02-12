"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Car, FolderKanban, TrendingUp, Banknote } from "lucide-react";

interface DashboardData {
  supplier: {
    id: string;
    firmaAdi: string;
    telefon: string | null;
    email: string | null;
  };
  stats: {
    vehicleCount: number;
    projectCount: number;
    totalTrips: number;
    totalRevenue: number;
    currentMonthTrips: number;
    currentMonthRevenue: number;
  };
  vehicles: Array<{
    id: string;
    plaka: string;
    marka: string | null;
    model: string | null;
    driver: string | null;
    projects: string[];
  }>;
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/supplier-portal/dashboard", { cache: "no-store" });
  if (!res.ok) throw new Error("Veriler yüklenemedi");
  return res.json();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(amount);
}

export default function SupplierDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["supplier-dashboard"],
    queryFn: fetchDashboard,
    staleTime: 0,
    refetchOnMount: "always",
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-center text-muted-foreground">Veriler yüklenemedi</div>;
  }

  const statCards = [
    {
      title: "Araç Sayısı",
      value: data.stats.vehicleCount,
      icon: Car,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Aktif Proje",
      value: data.stats.projectCount,
      icon: FolderKanban,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      title: "Bu Ay Sefer",
      value: data.stats.currentMonthTrips,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950/30",
    },
    {
      title: "Bu Ay Hakediş",
      value: formatCurrency(data.stats.currentMonthRevenue),
      icon: Banknote,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Hoş Geldiniz, {data.supplier.firmaAdi}
        </h1>
        <p className="text-muted-foreground mt-1">
          Araçlarınızın durumunu ve hakediş bilgilerinizi buradan takip edebilirsiniz.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Vehicles Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Araçlarım
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.vehicles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Henüz kayıtlı araç bulunmuyor.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plaka</TableHead>
                    <TableHead>Marka / Model</TableHead>
                    <TableHead>Şoför</TableHead>
                    <TableHead>Projeler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.plaka}</TableCell>
                      <TableCell>
                        {vehicle.marka || "-"} {vehicle.model || ""}
                      </TableCell>
                      <TableCell>{vehicle.driver || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {vehicle.projects.length > 0 ? (
                            vehicle.projects.map((p, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {p}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
