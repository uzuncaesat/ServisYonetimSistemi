"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

interface Project {
  id: string;
  ad: string;
  aciklama: string | null;
  baslangicTarihi: string | null;
  bitisTarihi: string | null;
  _count: {
    vehicles: number;
    routes: number;
    timesheets: number;
  };
}

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Projeler yüklenemedi");
  return res.json();
}

async function deleteProject(id: string) {
  const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Proje silinemedi");
  return res.json();
}

export default function ProjectsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Proje silindi" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Hata", description: "Proje silinemedi", variant: "destructive" });
    },
  });

  return (
    <div>
      <PageHeader
        title="Projeler"
        description="Servis projelerini yönetin"
        actionLabel="Yeni Proje"
        actionHref="/projeler/yeni"
      />

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proje Adı</TableHead>
              <TableHead>Başlangıç</TableHead>
              <TableHead>Bitiş</TableHead>
              <TableHead>Araç</TableHead>
              <TableHead>Güzergah</TableHead>
              <TableHead className="w-[120px]">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Yükleniyor...
                </TableCell>
              </TableRow>
            ) : projects?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  Henüz proje eklenmemiş
                </TableCell>
              </TableRow>
            ) : (
              projects?.map((project) => (
                <TableRow 
                  key={project.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => router.push(`/projeler/${project.id}`)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{project.ad}</p>
                      {project.aciklama && (
                        <p className="text-sm text-slate-500 truncate max-w-xs">
                          {project.aciklama}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {project.baslangicTarihi
                      ? formatDate(project.baslangicTarihi)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {project.bitisTarihi
                      ? formatDate(project.bitisTarihi)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{project._count.vehicles}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{project._count.routes}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/projeler/${project.id}/duzenle`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(project.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Projeyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu projeyi silmek istediğinizden emin misiniz? Tüm güzergahlar ve puantajlar da silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
