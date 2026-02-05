"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Edit, User, Car, FileText, Plus, X } from "lucide-react";
import Link from "next/link";
import { DocumentList } from "@/components/documents/document-list";

interface DriverDetail {
  id: string;
  adSoyad: string;
  telefon: string | null;
  ehliyetSinifi: string | null;
  email: string | null;
  vehicle: {
    id: string;
    plaka: string;
    marka: string | null;
    model: string | null;
    supplier: {
      firmaAdi: string;
    };
  } | null;
  documents: Array<{
    id: string;
    docType: string;
    title: string;
    fileName: string;
    validTo: string | null;
    createdAt: string;
  }>;
}

interface Vehicle {
  id: string;
  plaka: string;
  marka: string | null;
  model: string | null;
  driverId: string | null;
  supplier: {
    firmaAdi: string;
  };
}

async function fetchDriver(id: string): Promise<DriverDetail> {
  const res = await fetch(`/api/drivers/${id}`);
  if (!res.ok) throw new Error("Şoför bulunamadı");
  return res.json();
}

async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await fetch("/api/vehicles");
  if (!res.ok) throw new Error("Araçlar yüklenemedi");
  return res.json();
}

async function assignVehicleToDriver(vehicleId: string, driverId: string | null) {
  const res = await fetch(`/api/vehicles/${vehicleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driverId }),
  });
  if (!res.ok) throw new Error("Araç ataması yapılamadı");
  return res.json();
}

export default function DriverDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showVehicleDialog, setShowVehicleDialog] = useState(false);

  const { data: driver, isLoading } = useQuery({
    queryKey: ["driver", id],
    queryFn: () => fetchDriver(id),
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
    enabled: showVehicleDialog,
  });

  const assignMutation = useMutation({
    mutationFn: ({ vehicleId, driverId }: { vehicleId: string; driverId: string | null }) =>
      assignVehicleToDriver(vehicleId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver", id] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setShowVehicleDialog(false);
      toast({ title: "Araç ataması güncellendi" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Araç ataması yapılamadı", variant: "destructive" });
    },
  });

  const handleAssignVehicle = async (newVehicleId: string) => {
    // If driver already has a vehicle, first remove the old assignment
    if (driver?.vehicle && driver.vehicle.id !== newVehicleId) {
      await assignVehicleToDriver(driver.vehicle.id, null);
    }
    // Assign the new vehicle
    assignMutation.mutate({ vehicleId: newVehicleId, driverId: id });
  };

  const handleRemoveVehicle = () => {
    if (driver?.vehicle) {
      assignMutation.mutate({ vehicleId: driver.vehicle.id, driverId: null });
    }
  };

  // Filter available vehicles (no driver assigned or assigned to this driver)
  const availableVehicles = vehicles?.filter(
    (v) => v.driverId === null || v.driverId === id
  );

  if (isLoading) {
    return <div className="p-8 text-center">Yükleniyor...</div>;
  }

  if (!driver) {
    return <div className="p-8 text-center">Şoför bulunamadı</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/soforler">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User className="w-6 h-6" />
              {driver.adSoyad}
            </h1>
            <p className="text-slate-500">Şoför Detayı</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/soforler/${id}/duzenle`}>
            <Edit className="w-4 h-4 mr-2" />
            Düzenle
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="bilgiler">
        <TabsList>
          <TabsTrigger value="bilgiler">Bilgiler</TabsTrigger>
          <TabsTrigger value="evraklar">
            Evraklar
            {driver.documents.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {driver.documents.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bilgiler" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Şoför Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Kişisel Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Telefon</p>
                  <p className="font-medium">{driver.telefon || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium">{driver.email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Ehliyet Sınıfı</p>
                  <p className="font-medium">
                    {driver.ehliyetSinifi ? (
                      <Badge variant="secondary">{driver.ehliyetSinifi}</Badge>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Atanmış Araç */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Atanmış Araç
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVehicleDialog(true)}
                >
                  {driver.vehicle ? (
                    <>
                      <Edit className="w-4 h-4 mr-1" />
                      Değiştir
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      Araç Ata
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {driver.vehicle ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-500">Plaka</p>
                      <Link
                        href={`/araclar/${driver.vehicle.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {driver.vehicle.plaka}
                      </Link>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Marka / Model</p>
                      <p className="font-medium">
                        {driver.vehicle.marka || "-"} {driver.vehicle.model || ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Tedarikçi</p>
                      <p className="font-medium">{driver.vehicle.supplier.firmaAdi}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">
                    Bu şoföre henüz araç atanmamış
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="evraklar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Evraklar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentList ownerType="DRIVER" ownerId={id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Vehicle Assignment Dialog */}
      <Dialog open={showVehicleDialog} onOpenChange={setShowVehicleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Araç Ata - {driver.adSoyad}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Remove current assignment option */}
            {driver.vehicle && (
              <div className="pb-4 border-b">
                <p className="text-sm text-slate-500 mb-2">Mevcut Araç</p>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{driver.vehicle.plaka}</p>
                    <p className="text-sm text-slate-500">
                      {driver.vehicle.marka} {driver.vehicle.model}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveVehicle}
                    disabled={assignMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Kaldır
                  </Button>
                </div>
              </div>
            )}

            {/* Available vehicles list */}
            <div>
              <p className="text-sm text-slate-500 mb-2">
                {driver.vehicle ? "Başka Araç Seç" : "Araç Seç"}
              </p>
              {availableVehicles && availableVehicles.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {availableVehicles
                    .filter((v) => v.id !== driver.vehicle?.id)
                    .map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => handleAssignVehicle(vehicle.id)}
                      >
                        <div>
                          <p className="font-medium">{vehicle.plaka}</p>
                          <p className="text-sm text-slate-500">
                            {vehicle.marka || "-"} {vehicle.model || ""} | {vehicle.supplier.firmaAdi}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={assignMutation.isPending}
                        >
                          Ata
                        </Button>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-4">
                  Atanabilir araç bulunamadı
                </p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setShowVehicleDialog(false)}>
                Kapat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
