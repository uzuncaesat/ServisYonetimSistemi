"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

interface FuelEntry {
  id: string;
  vehicleId: string;
  tarih: string;
  yakitTipi: string;
  litre: number;
  birimFiyat: number;
  toplamTutar: number;
  km: number;
  istasyon: string | null;
  fisNo: string | null;
  notlar: string | null;
}

async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await fetch("/api/vehicles");
  if (!res.ok) throw new Error("Araçlar alınamadı");
  return res.json();
}

async function fetchEntry(id: string): Promise<FuelEntry> {
  const res = await fetch(`/api/fuel-entries/${id}`);
  if (!res.ok) throw new Error("Kayıt alınamadı");
  return res.json();
}

async function updateEntry(id: string, data: FuelFormData) {
  const res = await fetch(`/api/fuel-entries/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Güncellenemedi");
  }
  return res.json();
}

export default function EditFuelPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entry, isLoading } = useQuery({
    queryKey: ["fuel-entry", id],
    queryFn: () => fetchEntry(id),
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FuelFormData>({
    resolver: zodResolver(fuelSchema),
  });

  useEffect(() => {
    if (entry) {
      reset({
        vehicleId: entry.vehicleId,
        tarih: entry.tarih.slice(0, 10),
        yakitTipi: entry.yakitTipi as FuelFormData["yakitTipi"],
        litre: entry.litre,
        birimFiyat: entry.birimFiyat,
        toplamTutar: entry.toplamTutar,
        km: entry.km,
        istasyon: entry.istasyon ?? "",
        fisNo: entry.fisNo ?? "",
        notlar: entry.notlar ?? "",
      });
    }
  }, [entry, reset]);

  const litre = watch("litre");
  const birimFiyat = watch("birimFiyat");

  useEffect(() => {
    if (litre && birimFiyat) {
      const total = parseFloat((Number(litre) * Number(birimFiyat)).toFixed(2));
      setValue("toplamTutar", total);
    }
  }, [litre, birimFiyat, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FuelFormData) => updateEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-entries"] });
      queryClient.invalidateQueries({ queryKey: ["fuel-entry", id] });
      toast({ title: "Yakıt kaydı güncellendi" });
      router.push("/yakit");
    },
    onError: (err: Error) => {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) return <div className="p-8 text-center">Yükleniyor...</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <BackButton fallbackHref="/yakit" />
        <div>
          <h1 className="text-2xl font-bold">Yakıt Kaydını Düzenle</h1>
          <p className="text-muted-foreground">{entry?.tarih.slice(0, 10)}</p>
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
                    <SelectValue />
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
                <Input id="km" type="number" {...register("km")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="litre">Litre / kWh *</Label>
                <Input
                  id="litre"
                  type="number"
                  step="0.01"
                  {...register("litre")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birimFiyat">Birim Fiyat (TL) *</Label>
                <Input
                  id="birimFiyat"
                  type="number"
                  step="0.01"
                  {...register("birimFiyat")}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="toplamTutar">Toplam Tutar (TL) *</Label>
                <Input
                  id="toplamTutar"
                  type="number"
                  step="0.01"
                  {...register("toplamTutar")}
                />
                {errors.toplamTutar && (
                  <p className="text-xs text-destructive">
                    {errors.toplamTutar.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="istasyon">İstasyon</Label>
                <Input id="istasyon" {...register("istasyon")} />
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
                {mutation.isPending ? "Kaydediliyor..." : "Güncelle"}
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
