"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, FolderKanban, Car, Route, Plus, Trash2, MapPin, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ProjectDetail {
  id: string;
  ad: string;
  aciklama: string | null;
  baslangicTarihi: string | null;
  bitisTarihi: string | null;
  vehicles: Array<{
    id: string;
    vehicle: {
      id: string;
      plaka: string;
      marka: string | null;
      model: string | null;
      supplier: {
        firmaAdi: string;
      };
      driver: {
        adSoyad: string;
      } | null;
    };
    vehicleRoutes: Array<{
      id: string;
      route: {
        id: string;
        ad: string;
        birimFiyat: number;
      };
    }>;
  }>;
  routes: Array<{
    id: string;
    ad: string;
    baslangicNoktasi: string | null;
    bitisNoktasi: string | null;
    km: number | null;
    birimFiyat: number;
    kdvOrani: number;
  }>;
}

async function fetchProject(id: string): Promise<ProjectDetail> {
  const res = await fetch(`/api/projects/${id}`);
  if (!res.ok) throw new Error("Proje bulunamadı");
  return res.json();
}

async function fetchAllVehicles() {
  const res = await fetch("/api/vehicles");
  if (!res.ok) throw new Error("Araçlar yüklenemedi");
  return res.json();
}

async function addVehicleToProject(projectId: string, vehicleId: string) {
  const res = await fetch(`/api/projects/${projectId}/vehicles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vehicleId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Araç atanamadı");
  }
  return res.json();
}

async function removeVehicleFromProject(projectId: string, projectVehicleId: string) {
  const res = await fetch(`/api/projects/${projectId}/vehicles?projectVehicleId=${projectVehicleId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Araç kaldırılamadı");
  return res.json();
}

async function assignRouteToVehicle(routeId: string, projectVehicleId: string) {
  const res = await fetch(`/api/routes/${routeId}/vehicles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectVehicleId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Güzergah atanamadı");
  }
  return res.json();
}

async function removeRouteFromVehicle(routeId: string, projectVehicleId: string) {
  const res = await fetch(`/api/routes/${routeId}/vehicles?projectVehicleId=${projectVehicleId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Güzergah kaldırılamadı");
  return res.json();
}

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

async function getOrCreateTimesheet(projectId: string, vehicleId: string) {
  const res = await fetch("/api/timesheets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId,
      vehicleId,
      yil: currentYear,
      ay: currentMonth,
    }),
  });
  if (!res.ok) throw new Error("Puantaj açılamadı");
  return res.json();
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [removeVehicleId, setRemoveVehicleId] = useState<string | null>(null);
  const [routeAssignVehicle, setRouteAssignVehicle] = useState<{
    projectVehicleId: string;
    plaka: string;
    assignedRouteIds: string[];
  } | null>(null);
  const [puantajLoadingVehicleId, setPuantajLoadingVehicleId] = useState<string | null>(null);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProject(id),
  });

  const { data: allVehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchAllVehicles,
  });

  // Filter vehicles not already in project
  const assignedVehicleIds = project?.vehicles.map((v) => v.vehicle.id) || [];
  const availableVehicles = allVehicles?.filter(
    (v: { id: string }) => !assignedVehicleIds.includes(v.id)
  ) || [];

  const addVehicleMutation = useMutation({
    mutationFn: ({ vehicleId }: { vehicleId: string }) =>
      addVehicleToProject(id, vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      toast({ title: "Araç projeye eklendi" });
      setIsAddVehicleOpen(false);
      setSelectedVehicleId("");
    },
    onError: (error: Error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const removeVehicleMutation = useMutation({
    mutationFn: (projectVehicleId: string) =>
      removeVehicleFromProject(id, projectVehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      toast({ title: "Araç projeden kaldırıldı" });
      setRemoveVehicleId(null);
    },
    onError: () => {
      toast({ title: "Hata", description: "Araç kaldırılamadı", variant: "destructive" });
    },
  });

  const assignRouteMutation = useMutation({
    mutationFn: ({ routeId, projectVehicleId }: { routeId: string; projectVehicleId: string }) =>
      assignRouteToVehicle(routeId, projectVehicleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      // Update local state
      setRouteAssignVehicle((prev) =>
        prev ? { ...prev, assignedRouteIds: [...prev.assignedRouteIds, variables.routeId] } : null
      );
      toast({ title: "Güzergah araca atandı" });
    },
    onError: (error: Error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const removeRouteMutation = useMutation({
    mutationFn: ({ routeId, projectVehicleId }: { routeId: string; projectVehicleId: string }) =>
      removeRouteFromVehicle(routeId, projectVehicleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      // Update local state
      setRouteAssignVehicle((prev) =>
        prev ? { ...prev, assignedRouteIds: prev.assignedRouteIds.filter((id) => id !== variables.routeId) } : null
      );
      toast({ title: "Güzergah araçtan kaldırıldı" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Güzergah kaldırılamadı", variant: "destructive" });
    },
  });

  const handlePuantajGir = async (vehicleId: string) => {
    setPuantajLoadingVehicleId(vehicleId);
    try {
      const timesheet = await getOrCreateTimesheet(id, vehicleId);
      window.location.href = `/puantaj/${timesheet.id}`;
    } catch (err) {
      toast({
        title: "Hata",
        description: err instanceof Error ? err.message : "Puantaj açılamadı",
        variant: "destructive",
      });
      setPuantajLoadingVehicleId(null);
    }
  };

  const handleRouteToggle = (routeId: string, isAssigned: boolean) => {
    if (!routeAssignVehicle) return;
    
    if (isAssigned) {
      removeRouteMutation.mutate({
        routeId,
        projectVehicleId: routeAssignVehicle.projectVehicleId,
      });
    } else {
      assignRouteMutation.mutate({
        routeId,
        projectVehicleId: routeAssignVehicle.projectVehicleId,
      });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Yükleniyor...</div>;
  }

  if (!project) {
    return <div className="p-8 text-center">Proje bulunamadı</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projeler">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FolderKanban className="w-6 h-6" />
              {project.ad}
            </h1>
            {project.aciklama && (
              <p className="text-slate-500">{project.aciklama}</p>
            )}
          </div>
        </div>
        <Button asChild>
          <Link href={`/projeler/${id}/duzenle`}>
            <Edit className="w-4 h-4 mr-2" />
            Düzenle
          </Link>
        </Button>
      </div>

      {/* Proje Bilgileri */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Başlangıç Tarihi</p>
            <p className="font-medium">
              {project.baslangicTarihi ? formatDate(project.baslangicTarihi) : "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Bitiş Tarihi</p>
            <p className="font-medium">
              {project.bitisTarihi ? formatDate(project.bitisTarihi) : "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Araç Sayısı</p>
            <p className="font-medium text-2xl">{project.vehicles.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Güzergah Sayısı</p>
            <p className="font-medium text-2xl">{project.routes.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="araclar">
        <TabsList>
          <TabsTrigger value="araclar">
            <Car className="w-4 h-4 mr-2" />
            Araçlar
            <Badge variant="secondary" className="ml-2">
              {project.vehicles.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="guzergahlar">
            <Route className="w-4 h-4 mr-2" />
            Güzergahlar
            <Badge variant="secondary" className="ml-2">
              {project.routes.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="araclar" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Projeye Atanmış Araçlar</CardTitle>
              <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Araç Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Projeye Araç Ekle</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Select
                      value={selectedVehicleId}
                      onValueChange={setSelectedVehicleId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Araç seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVehicles.length === 0 ? (
                          <SelectItem value="__placeholder__" disabled>
                            Tüm araçlar atanmış
                          </SelectItem>
                        ) : (
                          availableVehicles.map((v: { id: string; plaka: string; supplier: { firmaAdi: string } }) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.plaka} - {v.supplier.firmaAdi}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddVehicleOpen(false)}
                      >
                        İptal
                      </Button>
                      <Button
                        onClick={() => addVehicleMutation.mutate({ vehicleId: selectedVehicleId })}
                        disabled={!selectedVehicleId || addVehicleMutation.isPending}
                      >
                        {addVehicleMutation.isPending ? "Ekleniyor..." : "Ekle"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {project.vehicles.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  Bu projeye henüz araç atanmamış
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plaka</TableHead>
                      <TableHead>Tedarikçi</TableHead>
                      <TableHead>Şoför</TableHead>
                      <TableHead>Güzergahlar</TableHead>
                      <TableHead className="w-[140px]">Puantaj</TableHead>
                      <TableHead className="w-[80px]">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.vehicles.map((pv) => (
                      <TableRow key={pv.id}>
                        <TableCell>
                          <Link
                            href={`/araclar/${pv.vehicle.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {pv.vehicle.plaka}
                          </Link>
                          <p className="text-sm text-slate-500">
                            {pv.vehicle.marka} {pv.vehicle.model}
                          </p>
                        </TableCell>
                        <TableCell>{pv.vehicle.supplier.firmaAdi}</TableCell>
                        <TableCell>
                          {pv.vehicle.driver?.adSoyad || (
                            <span className="text-slate-400">Atanmamış</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {pv.vehicleRoutes.length}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRouteAssignVehicle({
                                projectVehicleId: pv.id,
                                plaka: pv.vehicle.plaka,
                                assignedRouteIds: pv.vehicleRoutes.map((vr) => vr.route.id),
                              })}
                            >
                              <MapPin className="w-3 h-3 mr-1" />
                              Güzergah Ata
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handlePuantajGir(pv.vehicle.id)}
                            disabled={puantajLoadingVehicleId === pv.vehicle.id}
                          >
                            <ClipboardList className="w-3 h-3 mr-1" />
                            {puantajLoadingVehicleId === pv.vehicle.id ? "Açılıyor..." : "Puantaj gir"}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRemoveVehicleId(pv.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guzergahlar" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Proje Güzergahları</CardTitle>
              <Button asChild>
                <Link href={`/guzergahlar/yeni?projectId=${id}`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Güzergah Ekle
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {project.routes.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  Bu projede henüz güzergah tanımlanmamış
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Güzergah Adı</TableHead>
                      <TableHead>Başlangıç</TableHead>
                      <TableHead>Bitiş</TableHead>
                      <TableHead>KM</TableHead>
                      <TableHead>Birim Fiyat</TableHead>
                      <TableHead>KDV</TableHead>
                      <TableHead className="w-[80px]">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.routes.map((route) => (
                      <TableRow key={route.id}>
                        <TableCell className="font-medium">{route.ad}</TableCell>
                        <TableCell>{route.baslangicNoktasi || "-"}</TableCell>
                        <TableCell>{route.bitisNoktasi || "-"}</TableCell>
                        <TableCell>{route.km || "-"}</TableCell>
                        <TableCell>{formatCurrency(route.birimFiyat)}</TableCell>
                        <TableCell>%{route.kdvOrani}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/guzergahlar/${route.id}/duzenle`}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Remove vehicle confirmation */}
      <AlertDialog open={!!removeVehicleId} onOpenChange={() => setRemoveVehicleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aracı Projeden Kaldır</AlertDialogTitle>
            <AlertDialogDescription>
              Bu aracı projeden kaldırmak istediğinizden emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeVehicleId && removeVehicleMutation.mutate(removeVehicleId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Kaldır
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Route assignment dialog */}
      <Dialog open={!!routeAssignVehicle} onOpenChange={() => setRouteAssignVehicle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Güzergah Ata - {routeAssignVehicle?.plaka}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {project.routes.length === 0 ? (
              <p className="text-slate-500 text-center py-4">
                Bu projede henüz güzergah tanımlanmamış.
                <br />
                Önce güzergah ekleyin.
              </p>
            ) : (
              <div className="space-y-3">
                {project.routes.map((route) => {
                  const isAssigned = routeAssignVehicle?.assignedRouteIds.includes(route.id) || false;
                  return (
                    <div
                      key={route.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        id={`route-${route.id}`}
                        checked={isAssigned}
                        onCheckedChange={() => handleRouteToggle(route.id, isAssigned)}
                        disabled={assignRouteMutation.isPending || removeRouteMutation.isPending}
                      />
                      <Label
                        htmlFor={`route-${route.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{route.ad}</div>
                        <div className="text-sm text-slate-500">
                          {route.baslangicNoktasi || "-"} → {route.bitisNoktasi || "-"}
                          {" | "}
                          {formatCurrency(route.birimFiyat)}
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setRouteAssignVehicle(null)}
              >
                Kapat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
