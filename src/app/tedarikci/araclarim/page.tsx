"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, MapPin, User } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Araçlarım</h1>
        <p className="text-sm text-muted-foreground">
          Araçlarınızın detayları, şoförleri ve güzergah bilgileri.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      ) : !vehicles || vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="Henüz araç yok"
          description="Size tanımlanmış araçlar burada listelenir."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
                      <Car className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-base font-semibold tracking-tight">
                        {vehicle.plaka}
                      </span>
                      <p className="text-xs font-normal text-muted-foreground">
                        {vehicle.marka || ""} {vehicle.model || ""}
                        {vehicle.kisiSayisi ? ` · ${vehicle.kisiSayisi} kişilik` : ""}
                      </p>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vehicle.driver && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{vehicle.driver.adSoyad}</span>
                    {vehicle.driver.telefon && (
                      <span className="text-muted-foreground">
                        · {vehicle.driver.telefon}
                      </span>
                    )}
                  </div>
                )}

                {vehicle.projects.length > 0 ? (
                  <div className="space-y-3">
                    <Separator />
                    {vehicle.projects.map((pv) => (
                      <div key={pv.project.id} className="space-y-2">
                        <Badge variant="secondary">{pv.project.ad}</Badge>
                        {pv.vehicleRoutes.length > 0 ? (
                          <div className="space-y-1 pl-1">
                            {pv.vehicleRoutes.map((vr, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span>{vr.route.ad}</span>
                                </div>
                                <span className="font-medium tabular-nums text-foreground">
                                  {formatCurrency(vr.route.birimFiyat)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="pl-1 text-xs text-muted-foreground">
                            Güzergah atanmamış
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Herhangi bir projeye atanmamış.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
