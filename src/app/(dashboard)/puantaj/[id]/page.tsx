"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Layers } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, getDaysInMonth, calculateTimesheetTotals } from "@/lib/utils";

interface Route {
  id: string;
  ad: string;
  birimFiyat: number;
  kdvOrani: number;
}

interface TimesheetEntry {
  id: string;
  tarih: string;
  routeId: string;
  seferSayisi: number;
  birimFiyatSnapshot: number;
  kdvOraniSnapshot: number;
  route: Route;
}

interface Timesheet {
  id: string;
  yil: number;
  ay: number;
  project: {
    id: string;
    ad: string;
    routes: Route[];
  };
  vehicle: {
    id: string;
    plaka: string;
    supplier: { firmaAdi: string };
    driver: { adSoyad: string } | null;
  };
  entries: TimesheetEntry[];
}

async function fetchTimesheet(id: string): Promise<Timesheet> {
  const res = await fetch(`/api/timesheets/${id}`);
  if (!res.ok) throw new Error("Puantaj bulunamadı");
  return res.json();
}

async function fetchProjectRoutes(projectId: string, vehicleId: string): Promise<Route[]> {
  const params = new URLSearchParams({ projectId, vehicleId });
  const res = await fetch(`/api/routes?${params}`);
  if (!res.ok) throw new Error("Güzergahlar yüklenemedi");
  return res.json();
}

async function saveEntries(
  timesheetId: string,
  entries: Array<{ tarih: string; routeId: string; seferSayisi: number }>
) {
  const res = await fetch(`/api/timesheets/${timesheetId}/entries`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entries }),
  });
  if (!res.ok) throw new Error("Girişler kaydedilemedi");
  return res.json();
}

const monthNames = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export default function TimesheetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [gridData, setGridData] = useState<Map<string, number>>(new Map());
  const [hasChanges, setHasChanges] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkRouteId, setBulkRouteId] = useState<string>("");
  const [bulkStartDay, setBulkStartDay] = useState<number>(1);
  const [bulkEndDay, setBulkEndDay] = useState<number>(31);
  const [bulkSeferSayisi, setBulkSeferSayisi] = useState<number>(0);
  const [bulkIncludeWeekends, setBulkIncludeWeekends] = useState(false);

  const { data: timesheet, isLoading } = useQuery({
    queryKey: ["timesheet", id],
    queryFn: () => fetchTimesheet(id),
  });

  const { data: routes } = useQuery({
    queryKey: ["routes", timesheet?.project.id, timesheet?.vehicle.id],
    queryFn: () => fetchProjectRoutes(timesheet!.project.id, timesheet!.vehicle.id),
    enabled: !!timesheet?.project.id && !!timesheet?.vehicle.id,
  });

  // Initialize grid data from existing entries
  useEffect(() => {
    if (timesheet?.entries) {
      const newGridData = new Map<string, number>();
      timesheet.entries.forEach((entry) => {
        const day = new Date(entry.tarih).getDate();
        const key = `${entry.routeId}-${day}`;
        newGridData.set(key, entry.seferSayisi);
      });
      setGridData(newGridData);
    }
  }, [timesheet]);

  const saveMutation = useMutation({
    mutationFn: (entries: Array<{ tarih: string; routeId: string; seferSayisi: number }>) =>
      saveEntries(id, entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheet", id] });
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      setHasChanges(false);
      toast({ title: "Puantaj kaydedildi" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Kaydedilemedi", variant: "destructive" });
    },
  });

  const handleCellChange = useCallback((routeId: string, day: number, value: string) => {
    const numValue = parseInt(value) || 0;
    const key = `${routeId}-${day}`;
    
    setGridData((prev) => {
      const newData = new Map(prev);
      if (numValue === 0) {
        newData.delete(key);
      } else {
        newData.set(key, numValue);
      }
      return newData;
    });
    setHasChanges(true);
  }, []);

  const handleBulkApply = useCallback(() => {
    if (!timesheet || !bulkRouteId || bulkSeferSayisi <= 0) return;
    const daysInMonth = getDaysInMonth(timesheet.yil, timesheet.ay);
    const isWeekendDay = (day: number) => {
      const d = new Date(timesheet.yil, timesheet.ay - 1, day);
      const dow = d.getDay();
      return dow === 0 || dow === 6;
    };
    const start = Math.max(1, Math.min(bulkStartDay, bulkEndDay));
    const end = Math.min(daysInMonth, Math.max(bulkStartDay, bulkEndDay));

    setGridData((prev) => {
      const newData = new Map(prev);
      for (let day = start; day <= end; day++) {
        if (bulkIncludeWeekends || !isWeekendDay(day)) {
          newData.set(`${bulkRouteId}-${day}`, bulkSeferSayisi);
        }
      }
      return newData;
    });
    setHasChanges(true);
    setBulkOpen(false);
    toast({ title: "Toplu puantaj uygulandı", description: `${start}-${end} arası ${bulkSeferSayisi} sefer girildi.` });
  }, [timesheet, bulkRouteId, bulkStartDay, bulkEndDay, bulkSeferSayisi, bulkIncludeWeekends, toast]);

  const handleSave = () => {
    if (!timesheet) return;

    const entries: Array<{ tarih: string; routeId: string; seferSayisi: number }> = [];
    const daysInMonth = getDaysInMonth(timesheet.yil, timesheet.ay);

    routes?.forEach((route) => {
      for (let day = 1; day <= daysInMonth; day++) {
        const key = `${route.id}-${day}`;
        const seferSayisi = gridData.get(key) || 0;
        const tarih = `${timesheet.yil}-${String(timesheet.ay).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        entries.push({ tarih, routeId: route.id, seferSayisi });
      }
    });

    saveMutation.mutate(entries);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Yükleniyor...</div>;
  }

  if (!timesheet) {
    return <div className="p-8 text-center">Puantaj bulunamadı</div>;
  }

  const daysInMonth = getDaysInMonth(timesheet.yil, timesheet.ay);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isWeekend = (day: number) => {
    const d = new Date(timesheet.yil, timesheet.ay - 1, day);
    const dow = d.getDay(); // 0 = Pazar, 6 = Cumartesi
    return dow === 0 || dow === 6;
  };

  // Calculate totals
  const calculateRouteTotal = (routeId: string) => {
    let total = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${routeId}-${day}`;
      total += gridData.get(key) || 0;
    }
    return total;
  };

  const calculateRouteAmount = (routeId: string) => {
    const route = routes?.find((r) => r.id === routeId);
    if (!route) return 0;
    return calculateRouteTotal(routeId) * route.birimFiyat;
  };

  const allEntries = routes?.flatMap((route) => {
    const total = calculateRouteTotal(route.id);
    if (total === 0) return [];
    return [{
      seferSayisi: total,
      birimFiyatSnapshot: route.birimFiyat,
      kdvOraniSnapshot: route.kdvOrani,
    }];
  }) || [];

  const totals = calculateTimesheetTotals(allEntries.length > 0 ? allEntries : [{ seferSayisi: 0, birimFiyatSnapshot: 0, kdvOraniSnapshot: 20 }]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/puantaj">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Puantaj - {monthNames[timesheet.ay - 1]} {timesheet.yil}
            </h1>
            <p className="text-slate-500">
              {timesheet.project.ad} | {timesheet.vehicle.plaka} | {timesheet.vehicle.supplier.firmaAdi}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saveMutation.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Proje</p>
            <p className="font-medium">{timesheet.project.ad}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Araç</p>
            <p className="font-medium">{timesheet.vehicle.plaka}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Tedarikçi</p>
            <p className="font-medium">{timesheet.vehicle.supplier.firmaAdi}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Şoför</p>
            <p className="font-medium">{timesheet.vehicle.driver?.adSoyad || "-"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid Table */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sefer Girişi</CardTitle>
          {routes && routes.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBulkRouteId(routes[0]?.id ?? "");
                setBulkStartDay(1);
                setBulkEndDay(daysInMonth);
                setBulkSeferSayisi(0);
                setBulkIncludeWeekends(false);
                setBulkOpen(true);
              }}
            >
              <Layers className="w-4 h-4 mr-2" />
              Toplu puantaj gir
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!routes || routes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Bu projede tanımlı güzergah bulunmuyor.
              <Link href={`/guzergahlar/yeni?projectId=${timesheet.project.id}`} className="text-primary hover:underline ml-2">
                Güzergah ekle
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left sticky left-0 bg-muted min-w-[200px]">
                      Güzergah
                    </th>
                    <th className="border p-2 text-right min-w-[80px]">Fiyat</th>
                    {days.map((day) => (
                      <th
                        key={day}
                        className={`border p-1 text-center min-w-[40px] ${
                          isWeekend(day) ? "bg-amber-100 dark:bg-amber-900/30" : ""
                        }`}
                      >
                        {day}
                      </th>
                    ))}
                    <th className="border p-2 text-center min-w-[60px]">Top.</th>
                    <th className="border p-2 text-right min-w-[100px]">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((route) => (
                    <tr key={route.id}>
                      <td className="border p-2 font-medium sticky left-0 bg-background">
                        {route.ad}
                      </td>
                      <td className="border p-2 text-right text-muted-foreground">
                        {formatCurrency(route.birimFiyat)}
                      </td>
                      {days.map((day) => {
                        const key = `${route.id}-${day}`;
                        const value = gridData.get(key) || "";
                        const weekend = isWeekend(day);
                        return (
                          <td
                            key={day}
                            className={`border p-0 ${weekend ? "bg-amber-100 dark:bg-amber-900/30" : ""}`}
                          >
                            <Input
                              type="number"
                              min="0"
                              value={value}
                              onChange={(e) =>
                                handleCellChange(route.id, day, e.target.value)
                              }
                              className={`w-full h-8 text-center border-0 rounded-none p-1 ${
                                weekend ? "bg-amber-50 dark:bg-amber-900/20 focus:bg-amber-100 dark:focus:bg-amber-900/40" : ""
                              }`}
                            />
                          </td>
                        );
                      })}
                      <td className="border p-2 text-center font-medium bg-muted">
                        {calculateRouteTotal(route.id)}
                      </td>
                      <td className="border p-2 text-right font-medium bg-muted">
                        {formatCurrency(calculateRouteAmount(route.id))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toplu puantaj dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Toplu Puantaj Gir</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Güzergah</Label>
              <Select value={bulkRouteId} onValueChange={setBulkRouteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Güzergah seçin" />
                </SelectTrigger>
                <SelectContent>
                  {routes?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.ad} ({formatCurrency(r.birimFiyat)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Başlangıç günü (1-{daysInMonth})</Label>
                <Input
                  type="number"
                  min={1}
                  max={daysInMonth}
                  value={bulkStartDay}
                  onChange={(e) => setBulkStartDay(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>Bitiş günü (1-{daysInMonth})</Label>
                <Input
                  type="number"
                  min={1}
                  max={daysInMonth}
                  value={bulkEndDay}
                  onChange={(e) => setBulkEndDay(parseInt(e.target.value) || daysInMonth)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sefer sayısı (her gün)</Label>
              <Input
                type="number"
                min={0}
                value={bulkSeferSayisi}
                onChange={(e) => setBulkSeferSayisi(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bulk-weekends"
                checked={bulkIncludeWeekends}
                onCheckedChange={(checked) => setBulkIncludeWeekends(checked === true)}
              />
              <Label htmlFor="bulk-weekends" className="cursor-pointer">
                Hafta sonlarını dahil et (Cumartesi-Pazar)
              </Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setBulkOpen(false)}>
                İptal
              </Button>
              <Button
                onClick={handleBulkApply}
                disabled={!bulkRouteId || bulkSeferSayisi <= 0}
              >
                Uygula
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Hesaplama Özeti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Toplam (Net)</p>
              <p className="text-xl font-bold">{formatCurrency(totals.toplam)}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">KDV (%20)</p>
              <p className="text-xl font-bold">{formatCurrency(totals.kdv)}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Ara Toplam</p>
              <p className="text-xl font-bold">{formatCurrency(totals.araToplam)}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Tevkifat (5/10)</p>
              <p className="text-xl font-bold text-red-600">-{formatCurrency(totals.tevkifat)}</p>
            </div>
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-sm text-primary">Fatura Tutarı</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totals.faturaTutari)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
