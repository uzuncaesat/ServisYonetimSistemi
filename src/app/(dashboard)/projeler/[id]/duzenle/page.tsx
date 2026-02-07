"use client";

import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema, ProjectFormData } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

async function fetchProject(id: string) {
  const res = await fetch(`/api/projects/${id}`);
  if (!res.ok) throw new Error("Proje bulunamadı");
  return res.json();
}

async function updateProject(id: string, data: ProjectFormData) {
  const res = await fetch(`/api/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Proje güncellenemedi");
  return res.json();
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProject(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  useEffect(() => {
    if (project) {
      reset({
        ad: project.ad,
        aciklama: project.aciklama || "",
        baslangicTarihi: project.baslangicTarihi
          ? new Date(project.baslangicTarihi).toISOString().split("T")[0]
          : "",
        bitisTarihi: project.bitisTarihi
          ? new Date(project.bitisTarihi).toISOString().split("T")[0]
          : "",
      });
    }
  }, [project, reset]);

  const mutation = useMutation({
    mutationFn: (data: ProjectFormData) => updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      toast({ title: "Proje güncellendi" });
      router.push(`/projeler/${id}`);
    },
    onError: () => {
      toast({ title: "Hata", description: "Proje güncellenemedi", variant: "destructive" });
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Yükleniyor...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projeler/${id}`}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Proje Düzenle</h1>
          <p className="text-slate-500">{project?.ad}</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Proje Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ad">Proje Adı *</Label>
              <Input id="ad" {...register("ad")} />
              {errors.ad && (
                <p className="text-sm text-red-500">{errors.ad.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="aciklama">Açıklama</Label>
              <Textarea id="aciklama" {...register("aciklama")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baslangicTarihi">Başlangıç Tarihi</Label>
                <Input
                  id="baslangicTarihi"
                  type="date"
                  {...register("baslangicTarihi")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bitisTarihi">Bitiş Tarihi</Label>
                <Input
                  id="bitisTarihi"
                  type="date"
                  {...register("bitisTarihi")}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                {mutation.isPending ? "Kaydediliyor..." : "Güncelle"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/projeler/${id}`}>İptal</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
