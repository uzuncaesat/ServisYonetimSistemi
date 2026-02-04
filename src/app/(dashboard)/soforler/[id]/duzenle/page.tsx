"use client";

import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { driverSchema, DriverFormData } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

async function fetchDriver(id: string) {
  const res = await fetch(`/api/drivers/${id}`);
  if (!res.ok) throw new Error("Şoför bulunamadı");
  return res.json();
}

async function updateDriver(id: string, data: DriverFormData) {
  const res = await fetch(`/api/drivers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Şoför güncellenemedi");
  return res.json();
}

export default function EditDriverPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: driver, isLoading } = useQuery({
    queryKey: ["driver", id],
    queryFn: () => fetchDriver(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
  });

  useEffect(() => {
    if (driver) {
      reset({
        adSoyad: driver.adSoyad,
        telefon: driver.telefon || "",
        ehliyetSinifi: driver.ehliyetSinifi || "",
        email: driver.email || "",
      });
    }
  }, [driver, reset]);

  const mutation = useMutation({
    mutationFn: (data: DriverFormData) => updateDriver(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["driver", id] });
      toast({ title: "Şoför güncellendi" });
      router.push(`/soforler/${id}`);
    },
    onError: () => {
      toast({ title: "Hata", description: "Şoför güncellenemedi", variant: "destructive" });
    },
  });

  const onSubmit = (data: DriverFormData) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Yükleniyor...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/soforler/${id}`}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Şoför Düzenle</h1>
          <p className="text-slate-500">{driver?.adSoyad}</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Şoför Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adSoyad">Ad Soyad *</Label>
              <Input id="adSoyad" {...register("adSoyad")} />
              {errors.adSoyad && (
                <p className="text-sm text-red-500">{errors.adSoyad.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefon">Telefon</Label>
                <Input id="telefon" {...register("telefon")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ehliyetSinifi">Ehliyet Sınıfı</Label>
                <Input id="ehliyetSinifi" placeholder="B, C, D, E..." {...register("ehliyetSinifi")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                {mutation.isPending ? "Kaydediliyor..." : "Güncelle"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/soforler/${id}`}>İptal</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
