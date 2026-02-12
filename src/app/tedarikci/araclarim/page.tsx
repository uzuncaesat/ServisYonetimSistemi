"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, MapPin, User } from "lucide-react";

interface SupplierVehicle {
  id: string;
  plaka: string;
  marka: string | null;
  model: string | null;
  kisiSayisi: number | null;
  driver: { adSoyad: string; telefon: string | null } | null;
  projects: Array<{
    project: { id: string; ad: string };
    vehicleRoutes: Array<{
      route: { ad: string; birimFiyat: number };
    }>;
  }>;
}

async function fetchVehicles(): Promise<SupplierVehicle[]> {
  const res = await fetch("/api/supplier-portal/vehicles", { cache: "no-store" });
  if (!res.ok) throw new Error("Araçlar yüklenemedi");
  return res.json();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(amount);
}

export default function SupplierVehiclesPage() {
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["supplier-vehicles"],
    queryFn: fetchVehicles,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Araçlarım</h1>
        <p className="text-muted-foreground mt-1">
          Araçlarınızın detayları, şoförleri ve güzergah bilgileri
        </p>
      </div>

      {!vehicles || vehicles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Henüz kayıtlı araç bulunmuyor.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                      <Car className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-lg font-bold">{vehicle.plaka}</span>
                      <p className="text-sm text-muted-foreground font-normal">
                        {vehicle.marka || ""} {vehicle.model || ""}
                        {vehicle.kisiSayisi ? ` - ${vehicle.kisiSayisi} kişilik` : ""}
                      </p>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Şoför bilgisi */}
                {vehicle.driver && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{vehicle.driver.adSoyad}</span>
                    {vehicle.driver.telefon && (
                      <span className="text-muted-foreground">({vehicle.driver.telefon})</span>
                    )}
                  </div>
                )}

                {/* Projeler ve güzergahlar */}
                {vehicle.projects.length > 0 ? (
                  <div className="space-y-3">
                    {vehicle.projects.map((pv) => (
                      <div key={pv.project.id} className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{pv.project.ad}</Badge>
                        </div>
                        {pv.vehicleRoutes.length > 0 ? (
                          <div className="space-y-1">
                            {pv.vehicleRoutes.map((vr, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3 h-3 text-muted-foreground" />
                                  <span>{vr.route.ad}</span>
                                </div>
                                <span className="font-medium text-green-600">
                                  {formatCurrency(vr.route.birimFiyat)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Güzergah atanmamış</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Herhangi bir projeye atanmamış</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
