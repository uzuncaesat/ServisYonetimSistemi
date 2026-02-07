"use client";

import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { routeSchema, RouteFormData } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Factory } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { canEditFactoryPrice } from "@/lib/auth";

async function fetchRoute(id: string) {
  const res = await fetch(`/api/routes/${id}`);
  if (!res.ok) throw new Error("Güzergah bulunamadı");
  return res.json();
}

async function updateRoute(id: string, data: RouteFormData) {
  const res = await fetch(`/api/routes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Güzergah güncellenemedi");
  return res.json();
}

export default function EditRoutePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const showFactoryPrice = canEditFactoryPrice(session?.user?.role);

  const { data: route, isLoading } = useQuery({
    queryKey: ["route", id],
    queryFn: () => fetchRoute(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
  });

  useEffect(() => {
    if (route) {
      reset({
        ad: route.ad,
        baslangicNoktasi: route.baslangicNoktasi || "",
        bitisNoktasi: route.bitisNoktasi || "",
        km: route.km || undefined,
        birimFiyat: route.birimFiyat,
        fabrikaFiyati: route.fabrikaFiyati || undefined,
        kdvOrani: route.kdvOrani,
        projectId: route.projectId,
      });
    }
  }, [route, reset]);

  const mutation = useMutation({
    mutationFn: (data: RouteFormData) => updateRoute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["route", id] });
      queryClient.invalidateQueries({ queryKey: ["project", route?.projectId] });
      toast({ title: "Güzergah güncellendi" });
      router.push("/guzergahlar");
    },
    onError: () => {
      toast({ title: "Hata", description: "Güzergah güncellenemedi", variant: "destructive" });
    },
  });

  const onSubmit = (data: RouteFormData) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Yükleniyor...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/guzergahlar">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Güzergah Düzenle</h1>
          <p className="text-slate-500">{route?.ad}</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Güzergah Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Proje</Label>
              <Input value={route?.project?.ad || ""} disabled />
              <input type="hidden" {...register("projectId")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad">Güzergah Adı *</Label>
              <Input id="ad" {...register("ad")} />
              {errors.ad && (
                <p className="text-sm text-red-500">{errors.ad.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baslangicNoktasi">Başlangıç Noktası</Label>
                <Input id="baslangicNoktasi" {...register("baslangicNoktasi")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bitisNoktasi">Bitiş Noktası</Label>
                <Input id="bitisNoktasi" {...register("bitisNoktasi")} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="km">KM</Label>
                <Input id="km" type="number" step="0.1" {...register("km")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birimFiyat">Tedarikçi Fiyatı (₺) *</Label>
                <Input
                  id="birimFiyat"
                  type="number"
                  step="0.01"
                  {...register("birimFiyat")}
                />
                {errors.birimFiyat && (
                  <p className="text-sm text-red-500">{errors.birimFiyat.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="kdvOrani">KDV Oranı (%)</Label>
                <Input id="kdvOrani" type="number" {...register("kdvOrani")} />
              </div>
            </div>

            {/* Fabrika Fiyatı - Sadece Admin görebilir */}
            {showFactoryPrice && (
              <div className="space-y-2 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-2">
                  <Factory className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Fabrika Fiyatı (Gizli)</span>
                </div>
                <Label htmlFor="fabrikaFiyati">Fabrika Fiyatı (₺)</Label>
                <Input
                  id="fabrikaFiyati"
                  type="number"
                  step="0.01"
                  {...register("fabrikaFiyati")}
                  placeholder="200.00"
                  className="bg-card"
                />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Bu fiyat sadece Admin ve Yönetici tarafından görülebilir. Boş bırakılırsa tedarikçi fiyatı kullanılır.
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                {mutation.isPending ? "Kaydediliyor..." : "Güncelle"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/guzergahlar">İptal</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
