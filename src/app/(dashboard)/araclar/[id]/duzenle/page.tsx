"use client";

import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vehicleSchema, VehicleFormData } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

async function fetchVehicle(id: string) {
  const res = await fetch(`/api/vehicles/${id}`);
  if (!res.ok) throw new Error("Araç bulunamadı");
  return res.json();
}

async function fetchSuppliers() {
  const res = await fetch("/api/suppliers");
  if (!res.ok) throw new Error("Tedarikçiler yüklenemedi");
  return res.json();
}

async function fetchDrivers() {
  const res = await fetch("/api/drivers");
  if (!res.ok) throw new Error("Şoförler yüklenemedi");
  return res.json();
}

async function updateVehicle(id: string, data: VehicleFormData) {
  const res = await fetch(`/api/vehicles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Araç güncellenemedi");
  }
  return res.json();
}

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vehicle, isLoading: vehicleLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => fetchVehicle(id),
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: fetchSuppliers,
  });

  const { data: drivers } = useQuery({
    queryKey: ["drivers"],
    queryFn: fetchDrivers,
  });

  // Filter drivers that don't have a vehicle assigned OR are the current driver
  const availableDrivers = drivers?.filter(
    (d: { id: string; vehicle: { id: string } | null }) =>
      !d.vehicle || d.vehicle.id === id
  ) || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
  });

  useEffect(() => {
    if (vehicle) {
      reset({
        plaka: vehicle.plaka,
        marka: vehicle.marka || "",
        model: vehicle.model || "",
        kisiSayisi: vehicle.kisiSayisi || undefined,
        supplierId: vehicle.supplier.id,
        driverId: vehicle.driver?.id || null,
      });
    }
  }, [vehicle, reset]);

  const mutation = useMutation({
    mutationFn: (data: VehicleFormData) => updateVehicle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle", id] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({ title: "Araç güncellendi" });
      router.push(`/araclar/${id}`);
    },
    onError: (error: Error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: VehicleFormData) => {
    mutation.mutate(data);
  };

  if (vehicleLoading) {
    return <div className="p-8 text-center">Yükleniyor...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/araclar/${id}`}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Araç Düzenle</h1>
          <p className="text-slate-500">{vehicle?.plaka}</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Araç Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plaka">Plaka *</Label>
              <Input
                id="plaka"
                {...register("plaka")}
                className="uppercase"
              />
              {errors.plaka && (
                <p className="text-sm text-red-500">{errors.plaka.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marka">Marka</Label>
                <Input id="marka" {...register("marka")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input id="model" {...register("model")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kisiSayisi">Kişi Sayısı</Label>
              <Input
                id="kisiSayisi"
                type="number"
                {...register("kisiSayisi")}
              />
            </div>

            <div className="space-y-2">
              <Label>Tedarikçi *</Label>
              <Select
                value={watch("supplierId")}
                onValueChange={(value) => setValue("supplierId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tedarikçi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier: { id: string; firmaAdi: string }) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.firmaAdi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supplierId && (
                <p className="text-sm text-red-500">{errors.supplierId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Şoför (Opsiyonel)</Label>
              <Select
                value={watch("driverId") || "__none__"}
                onValueChange={(value) => setValue("driverId", value === "__none__" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Şoför seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Şoför atama</SelectItem>
                  {availableDrivers.map((driver: { id: string; adSoyad: string }) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.adSoyad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                {mutation.isPending ? "Kaydediliyor..." : "Güncelle"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/araclar/${id}`}>İptal</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
