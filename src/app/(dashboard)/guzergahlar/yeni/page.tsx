"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { routeSchema, RouteFormData } from "@/lib/validations";
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
import { ArrowLeft, Factory } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { canEditFactoryPrice } from "@/lib/auth";

async function fetchProjects() {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Projeler yüklenemedi");
  return res.json();
}

async function createRoute(data: RouteFormData) {
  const res = await fetch("/api/routes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Güzergah oluşturulamadı");
  return res.json();
}

export default function NewRoutePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProjectId = searchParams.get("projectId");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const showFactoryPrice = canEditFactoryPrice(session?.user?.role);

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      kdvOrani: 20,
      projectId: preselectedProjectId || "",
    },
  });

  useEffect(() => {
    if (preselectedProjectId) {
      setValue("projectId", preselectedProjectId);
    }
  }, [preselectedProjectId, setValue]);

  const mutation = useMutation({
    mutationFn: createRoute,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      queryClient.invalidateQueries({ queryKey: ["project", data.projectId] });
      toast({ title: "Güzergah oluşturuldu" });
      if (preselectedProjectId) {
        router.push(`/projeler/${preselectedProjectId}`);
      } else {
        router.push("/guzergahlar");
      }
    },
    onError: () => {
      toast({ title: "Hata", description: "Güzergah oluşturulamadı", variant: "destructive" });
    },
  });

  const onSubmit = (data: RouteFormData) => {
    mutation.mutate(data);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={preselectedProjectId ? `/projeler/${preselectedProjectId}` : "/guzergahlar"}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Yeni Güzergah</h1>
          <p className="text-slate-500">Yeni bir güzergah tanımlayın</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Güzergah Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Proje *</Label>
              <Select
                value={watch("projectId")}
                onValueChange={(value) => setValue("projectId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Proje seçin" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project: { id: string; ad: string }) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.ad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && (
                <p className="text-sm text-red-500">{errors.projectId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad">Güzergah Adı *</Label>
              <Input id="ad" {...register("ad")} placeholder="Fabrika - Merkez" />
              {errors.ad && (
                <p className="text-sm text-red-500">{errors.ad.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baslangicNoktasi">Başlangıç Noktası</Label>
                <Input
                  id="baslangicNoktasi"
                  {...register("baslangicNoktasi")}
                  placeholder="Fabrika"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bitisNoktasi">Bitiş Noktası</Label>
                <Input
                  id="bitisNoktasi"
                  {...register("bitisNoktasi")}
                  placeholder="Merkez"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="km">KM</Label>
                <Input
                  id="km"
                  type="number"
                  step="0.1"
                  {...register("km")}
                  placeholder="25"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birimFiyat">Tedarikçi Fiyatı (₺) *</Label>
                <Input
                  id="birimFiyat"
                  type="number"
                  step="0.01"
                  {...register("birimFiyat")}
                  placeholder="150.00"
                />
                {errors.birimFiyat && (
                  <p className="text-sm text-red-500">{errors.birimFiyat.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="kdvOrani">KDV Oranı (%)</Label>
                <Input
                  id="kdvOrani"
                  type="number"
                  {...register("kdvOrani")}
                  placeholder="20"
                />
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
                  className="bg-white dark:bg-slate-800"
                />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Bu fiyat sadece Admin ve Yönetici tarafından görülebilir. Boş bırakılırsa tedarikçi fiyatı kullanılır.
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                {mutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={preselectedProjectId ? `/projeler/${preselectedProjectId}` : "/guzergahlar"}>
                  İptal
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
