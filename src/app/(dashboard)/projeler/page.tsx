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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, FolderKanban, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";

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
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Proje silindi" });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Proje silinemedi",
        variant: "destructive",
      });
    },
  });

  const hasProjects = (projects?.length ?? 0) > 0;

  return (
    <div>
      <PageHeader
        title="Projeler"
        description="Servis projelerini yönetin."
        actionLabel="Yeni proje"
        actionHref="/projeler/yeni"
      />

      {!isLoading && !hasProjects ? (
        <EmptyState
          icon={FolderKanban}
          title="Henüz proje yok"
          description="İlk projenizi oluşturarak başlayın. Projeler; araç, güzergah ve puantaj kayıtlarını gruplar."
          action={
            <Button asChild>
              <Link href="/projeler/yeni">Yeni proje</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proje adı</TableHead>
                <TableHead>Başlangıç</TableHead>
                <TableHead>Bitiş</TableHead>
                <TableHead>Araç</TableHead>
                <TableHead>Güzergah</TableHead>
                <TableHead className="w-[60px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton columns={6} />
              ) : (
                projects?.map((project) => (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/projeler/${project.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">
                          {project.ad}
                        </p>
                        {project.aciklama ? (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {project.aciklama}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.baslangicTarihi
                        ? formatDate(project.baslangicTarihi)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.bitisTarihi
                        ? formatDate(project.bitisTarihi)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {project._count.vehicles}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {project._count.routes}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex"
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/projeler/${project.id}/duzenle`}>
                                <Edit /> Düzenle
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteId(project.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="text-destructive" /> Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Projeyi sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu projeyi silmek istediğinizden emin misiniz? Tüm güzergahlar ve
              puantajlar da silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
