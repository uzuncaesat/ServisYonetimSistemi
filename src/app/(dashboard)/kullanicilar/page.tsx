"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { canManageUsers } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { Settings } from "lucide-react";

const DEFAULT_REPORT_TYPE_KEY = "default_report_price_type";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

async function fetchUsers(): Promise<User[]> {
  const res = await fetch("/api/users");
  if (!res.ok) {
    if (res.status === 403) throw new Error("Yetkiniz yok");
    throw new Error("Kullanıcılar yüklenemedi");
  }
  return res.json();
}

async function fetchSettings(): Promise<Record<string, string>> {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("Ayarlar yüklenemedi");
  return res.json();
}

async function updateSetting(key: string, value: string) {
  const res = await fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) throw new Error("Ayar güncellenemedi");
  return res.json();
}

async function updateUserRole(id: string, role: string) {
  const res = await fetch(`/api/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Rol güncellenemedi");
  }
  return res.json();
}

export default function UsersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canAccess = canManageUsers(session?.user?.role);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    if (!canAccess) {
      router.push("/");
    }
  }, [session, status, canAccess, router]);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    enabled: !!session && canAccess,
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    enabled: !!session && canAccess,
  });

  const defaultReportType = settings?.[DEFAULT_REPORT_TYPE_KEY] || "supplier";

  const settingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Ayar kaydedildi" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Ayar güncellenemedi", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Rol güncellendi" });
    },
    onError: (error: Error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "MANAGER":
        return "default";
      default:
        return "secondary";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "MANAGER":
        return "Yönetici";
      default:
        return "Kullanıcı";
    }
  };

  if (status === "loading" || !canAccess) {
    return (
      <div className="p-8 text-center">
        {status === "loading" ? "Yükleniyor..." : "Yetkiniz yok."}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Kullanıcı Yönetimi"
        description="Sistem kullanıcılarının rollerini yönetin"
      />

      <div className="overflow-x-auto min-w-0">
        <div className="bg-card rounded-lg border dark:border-slate-700/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 dark:bg-slate-800/50">
                <TableHead>Ad</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
                <TableHead className="w-[200px]">Rol Değiştir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : users?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Henüz kullanıcı bulunmuyor
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((user) => (
                  <TableRow
                    key={user.id}
                    className="hover:bg-muted/50 dark:hover:bg-slate-800/30"
                  >
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(role) => {
                          if (role !== user.role) {
                            updateMutation.mutate({ id: user.id, role });
                          }
                        }}
                        disabled={updateMutation.isPending}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">Kullanıcı</SelectItem>
                          <SelectItem value="MANAGER">Yönetici</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
