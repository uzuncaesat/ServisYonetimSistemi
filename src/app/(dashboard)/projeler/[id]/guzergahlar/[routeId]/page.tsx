"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Label } from "@/components/ui/label";
import { Edit, ClipboardList, Route } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { BackButton } from "@/components/layout/back-button";

interface RouteDetail {
  id: string;
  ad: string;
  baslangicNoktasi: string | null;
  bitisNoktasi: string | null;
  km: number | null;
  birimFiyat: number;
  kdvOrani: number;
  projectId: string;
  project: { id: string; ad: string };
  vehicleRoutes: Array<{
    id: string;
    projectVehicle: {
      id: string;
      vehicle: {
        id: string;
        plaka: string;
        supplier: { firmaAdi: string };
        driver: { adSoyad: string } | null;
      };
    };
  }>;
}

async function fetchRoute(id: string): Promise<RouteDetail> {
  const res = await fetch(`/api/routes/${id}`);
  if (!res.ok) throw new Error("Güzergah bulunamadı");
  return res.json();
}

async function getOrCreateTimesheet(
  projectId: string,
  vehicleId: string,
  yil: number,
  ay: number,
) {
  const res = await fetch("/api/timesheets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, vehicleId, yil, ay }),
  });
  if (!res.ok) throw new Error("Puantaj açılamadı");
  return res.json();
}

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const monthNames = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export default function ProjectRouteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.id as string;
  const routeId = params.routeId as string;

  const [puantajPick, setPuantajPick] = useState<{
    vehicleId: string;
    plaka: string;
  } | null>(null);
  const [puantajPickYil, setPuantajPickYil] = useState(currentYear);
  const [puantajPickAy, setPuantajPickAy] = useState(currentMonth);
  const [puantajSubmitting, setPuantajSubmitting] = useState(false);

  const { data: route, isLoading, error } = useQuery({
    queryKey: ["route", routeId],
    queryFn: () => fetchRoute(routeId),
  });

  const handlePuantajConfirm = async () => {
    if (!puantajPick) return;
    setPuantajSubmitting(true);
    try {
      const timesheet = await getOrCreateTimesheet(
        projectId,
        puantajPick.vehicleId,
        puantajPickYil,
        puantajPickAy,
      );
      setPuantajPick(null);
      router.push(`/puantaj/${timesheet.id}`);
    } catch (err) {
      toast({
        title: "Hata",
        description: err instanceof Error ? err.message : "Puantaj açılamadı",
        variant: "destructive",
      });
    } finally {
      setPuantajSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Yükleniyor...</div>;
  }

  if (error || !route) {
    return <div className="p-8 text-center">Güzergah bulunamadı</div>;
  }

  if (route.projectId !== projectId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Bu güzergah seçilen projeye ait değil.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <BackButton fallbackHref={`/projeler/${projectId}?tab=guzergahlar`} />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Route className="w-6 h-6" />
              {route.ad}
            </h1>
            <p className="text-muted-foreground">
              {route.project.ad} · {route.baslangicNoktasi || "-"} →{" "}
              {route.bitisNoktasi || "-"}
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/guzergahlar/${routeId}/duzenle?projectId=${projectId}`}>
            <Edit className="w-4 h-4 mr-2" />
            Düzenle
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">KM</p>
            <p className="font-medium text-xl">{route.km ?? "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Birim Fiyat</p>
            <p className="font-medium">{formatCurrency(route.birimFiyat)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">KDV</p>
            <p className="font-medium">%{route.kdvOrani}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Atanmış Araç</p>
            <p className="font-medium text-xl">{route.vehicleRoutes.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bu güzergaha atanmış araçlar</CardTitle>
        </CardHeader>
        <CardContent>
          {route.vehicleRoutes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Bu güzergaha henüz araç atanmamış. Proje araçları sekmesinden güzergah atayabilirsiniz.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plaka</TableHead>
                  <TableHead>Tedarikçi</TableHead>
                  <TableHead>Şoför</TableHead>
                  <TableHead className="w-[140px]">Puantaj</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {route.vehicleRoutes.map((vr) => (
                  <TableRow key={vr.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/araclar/${vr.projectVehicle.vehicle.id}`}
                        className="text-primary hover:underline"
                      >
                        {vr.projectVehicle.vehicle.plaka}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {vr.projectVehicle.vehicle.supplier.firmaAdi}
                    </TableCell>
                    <TableCell>
                      {vr.projectVehicle.vehicle.driver?.adSoyad || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() =>
                          setPuantajPick({
                            vehicleId: vr.projectVehicle.vehicle.id,
                            plaka: vr.projectVehicle.vehicle.plaka,
                          })
                        }
                      >
                        <ClipboardList className="w-3 h-3 mr-1" />
                        Puantaj gir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!puantajPick} onOpenChange={(open) => !open && setPuantajPick(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Puantaj dönemi — {puantajPick?.plaka}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Yıl</Label>
              <Select
                value={puantajPickYil.toString()}
                onValueChange={(v) => setPuantajPickYil(parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ay</Label>
              <Select
                value={puantajPickAy.toString()}
                onValueChange={(v) => setPuantajPickAy(parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((m, idx) => (
                    <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPuantajPick(null)}>
                İptal
              </Button>
              <Button onClick={handlePuantajConfirm} disabled={puantajSubmitting}>
                {puantajSubmitting ? "Açılıyor…" : "Puantaja git"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
