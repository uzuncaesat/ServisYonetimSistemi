"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, Banknote, TrendingUp } from "lucide-react";

interface TimesheetSummary {
  id: string;
  yil: number;
  ay: number;
  vehicle: { plaka: string; marka: string | null };
  project: { ad: string };
  entries: Array<{
    tarih: string;
    seferSayisi: number;
    birimFiyatSnapshot: number;
    route: { ad: string };
  }>;
  toplamSefer: number;
  toplamTutar: number;
}

async function fetchTimesheets(yil: number, ay: number): Promise<TimesheetSummary[]> {
  const res = await fetch(`/api/supplier-portal/timesheets?yil=${yil}&ay=${ay}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Puantajlar yüklenemedi");
  return res.json();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(amount);
}

const aylar = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export default function SupplierTimesheetsPage() {
  const now = new Date();
  const [yil, setYil] = useState(now.getFullYear());
  const [ay, setAy] = useState(now.getMonth() + 1);

  const { data: timesheets, isLoading } = useQuery({
    queryKey: ["supplier-timesheets", yil, ay],
    queryFn: () => fetchTimesheets(yil, ay),
  });

  const totalRevenue = timesheets?.reduce((sum, ts) => sum + ts.toplamTutar, 0) || 0;
  const totalTrips = timesheets?.reduce((sum, ts) => sum + ts.toplamSefer, 0) || 0;

  // Yıl seçenekleri (son 3 yıl)
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Puantaj / Hakediş</h1>
        <p className="text-muted-foreground mt-1">
          Aylık sefer sayıları ve hakediş tutarlarınız
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={String(yil)} onValueChange={(v) => setYil(Number(v))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(ay)} onValueChange={(v) => setAy(Number(v))}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {aylar.map((a, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Puantaj Sayısı</p>
              <p className="text-2xl font-bold">{timesheets?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/30">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Toplam Sefer</p>
              <p className="text-2xl font-bold">{totalTrips}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30">
              <Banknote className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Toplam Hakediş</p>
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timesheets Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>
            {aylar[ay - 1]} {yil} Puantajları
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
            </div>
          ) : !timesheets || timesheets.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Bu döneme ait puantaj bulunmuyor.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proje</TableHead>
                    <TableHead>Araç</TableHead>
                    <TableHead className="text-right">Toplam Sefer</TableHead>
                    <TableHead className="text-right">Hakediş</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timesheets.map((ts) => (
                    <TableRow key={ts.id}>
                      <TableCell>
                        <Badge variant="secondary">{ts.project.ad}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {ts.vehicle.plaka}
                        {ts.vehicle.marka && (
                          <span className="text-muted-foreground text-sm ml-2">
                            ({ts.vehicle.marka})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {ts.toplamSefer}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatCurrency(ts.toplamTutar)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Toplam satırı */}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={2}>TOPLAM</TableCell>
                    <TableCell className="text-right">{totalTrips}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(totalRevenue)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
