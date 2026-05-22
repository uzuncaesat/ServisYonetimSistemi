"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fuelSchema, FuelFormData, fuelTypes } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/layout/back-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";


interface Vehicle {
  id: string;
  plaka: string;
  marka: string | null;
  model: string | null;
}

async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await fetch("/api/vehicles");
  if (!res.ok) throw new Error("Araçlar alınamadı");
  return res.json();
}

async function createFuel(data: FuelFormData) {
  const res = await fetch("/api/fuel-entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Kayıt oluşturulamadı");
  }
  return res.json();
}

export default function NewFuelPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FuelFormData>({
    resolver: zodResolver(fuelSchema),
    defaultValues: {
      tarih: new Date().toISOString().slice(0, 10),
      yakitTipi: "MOTORIN",
    },
  });

  const litre = watch("litre");
  const birimFiyat = watch("birimFiyat");

  // Litre × birim fiyat değiştikçe toplam tutarı otomatik güncelle
  useEffect(() => {
    if (litre && birimFiyat) {
      const total = parseFloat((Number(litre) * Number(birimFiyat)).toFixed(2));
      setValue("toplamTutar", total);
    }
  }, [litre, birimFiyat, setValue]);

  const mutation = useMutation({
    mutationFn: createFuel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-entries"] });
      toast({ title: "Yakıt kaydı oluşturuldu" });
      router.push("/yakit");
    },
    onError: (err: Error) => {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <BackButton fallbackHref="/yakit" />
        <div>
          <h1 className="text-2xl font-bold">Yeni Yakıt Kaydı</h1>
          <p className="text-muted-foreground">Araç dolumu kaydedin</p>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Kayıt Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((data) => mutation.mutate(data))}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Araç *</Label>
                <Select
                  value={watch("vehicleId")}
                  onValueChange={(v) => setValue("vehicleId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Araç seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles?.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.plaka} — {v.marka ?? ""} {v.model ?? ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vehicleId && (
                  <p className="text-xs text-destructive">{errors.vehicleId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tarih">Tarih *</Label>
                <Input id="tarih" type="date" {...register("tarih")} />
              </div>

              <div className="space-y-2">
                <Label>Yakıt Tipi *</Label>
                <Select
                  value={watch("yakitTipi")}
                  onValueChange={(v) =>
                    setValue("yakitTipi", v as FuelFormData["yakitTipi"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fuelTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="km">Km *</Label>
                <Input
                  id="km"
                  type="number"
                  inputMode="numeric"
                  placeholder="125000"
                  {...register("km")}
                />
                {errors.km && (
                  <p className="text-xs text-destructive">{errors.km.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="litre">Litre / kWh *</Label>
                <Input
                  id="litre"
                  type="number"
                  step="0.01"
                  placeholder="50.00"
                  {...register("litre")}
                />
                {errors.litre && (
                  <p className="text-xs text-destructive">{errors.litre.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birimFiyat">Birim Fiyat (TL) *</Label>
                <Input
                  id="birimFiyat"
                  type="number"
                  step="0.01"
                  placeholder="42.50"
                  {...register("birimFiyat")}
                />
                {errors.birimFiyat && (
                  <p className="text-xs text-destructive">
                    {errors.birimFiyat.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="toplamTutar">Toplam Tutar (TL) *</Label>
                <Input
                  id="toplamTutar"
                  type="number"
                  step="0.01"
                  {...register("toplamTutar")}
                />
                <p className="text-xs text-muted-foreground">
                  Litre × birim fiyat otomatik hesaplanır, gerektiğinde manuel
                  düzeltebilirsiniz.
                </p>
                {errors.toplamTutar && (
                  <p className="text-xs text-destructive">
                    {errors.toplamTutar.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="istasyon">İstasyon</Label>
                <Input
                  id="istasyon"
                  placeholder="OPET, Shell vb."
                  {...register("istasyon")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fisNo">Fiş / Fatura No</Label>
                <Input id="fisNo" {...register("fisNo")} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notlar">Notlar</Label>
                <Textarea id="notlar" rows={3} {...register("notlar")} />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                {mutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/yakit">İptal</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
