"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

async function createDriver(data: DriverFormData) {
  const res = await fetch("/api/drivers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Şoför oluşturulamadı");
  return res.json();
}

export default function NewDriverPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
  });

  const mutation = useMutation({
    mutationFn: createDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({ title: "Şoför oluşturuldu" });
      router.push("/soforler");
    },
    onError: () => {
      toast({ title: "Hata", description: "Şoför oluşturulamadı", variant: "destructive" });
    },
  });

  const onSubmit = (data: DriverFormData) => {
    mutation.mutate(data);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/soforler">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Yeni Şoför</h1>
          <p className="text-slate-500">Yeni bir şoför kaydı oluşturun</p>
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
                {mutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/soforler">İptal</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
