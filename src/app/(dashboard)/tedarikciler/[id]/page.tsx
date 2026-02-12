"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Edit, Building2, Car, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

interface SupplierDetail {
  id: string;
  firmaAdi: string;
  vergiNo: string | null;
  vergiDairesi: string | null;
  telefon: string | null;
  email: string | null;
  adres: string | null;
  vehicles: Array<{
    id: string;
    plaka: string;
    marka: string | null;
    model: string | null;
    driver: {
      adSoyad: string;
    } | null;
  }>;
}

async function fetchSupplier(id: string): Promise<SupplierDetail> {
  const res = await fetch(`/api/suppliers/${id}`);
  if (!res.ok) throw new Error("Tedarikçi bulunamadı");
  return res.json();
}

export default function SupplierDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [portalDialogOpen, setPortalDialogOpen] = useState(false);
  const [portalEmail, setPortalEmail] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [portalName, setPortalName] = useState("");

  const { data: supplier, isLoading } = useQuery({
    queryKey: ["supplier", id],
    queryFn: () => fetchSupplier(id),
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/suppliers/${id}/portal-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: portalEmail,
          password: portalPassword,
          name: portalName || supplier?.firmaAdi,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Portal hesabı oluşturulamadı");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Portal hesabı oluşturuldu", description: "Tedarikçi artık portala giriş yapabilir." });
      setPortalDialogOpen(false);
      setPortalEmail("");
      setPortalPassword("");
      setPortalName("");
    },
    onError: (error: Error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center">Yükleniyor...</div>;
  }

  if (!supplier) {
    return <div className="p-8 text-center">Tedarikçi bulunamadı</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tedarikciler">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              {supplier.firmaAdi}
            </h1>
            <p className="text-slate-500">Tedarikçi Detayı</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session?.user?.role === "ADMIN" && (
            <Dialog open={portalDialogOpen} onOpenChange={setPortalDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Portal Hesabı Oluştur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tedarikçi Portal Hesabı</DialogTitle>
                  <DialogDescription>
                    {supplier.firmaAdi} için portal giriş bilgileri oluşturun. Tedarikçi bu bilgilerle giriş yaparak kendi araç ve hakediş verilerini görebilir.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="portal-name">Ad Soyad / Firma Adı</Label>
                    <Input
                      id="portal-name"
                      placeholder={supplier.firmaAdi}
                      value={portalName}
                      onChange={(e) => setPortalName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portal-email">E-posta *</Label>
                    <Input
                      id="portal-email"
                      type="email"
                      placeholder={supplier.email || "ornek@firma.com"}
                      value={portalEmail}
                      onChange={(e) => setPortalEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portal-password">Şifre *</Label>
                    <Input
                      id="portal-password"
                      type="password"
                      placeholder="En az 6 karakter"
                      value={portalPassword}
                      onChange={(e) => setPortalPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setPortalDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={() => portalMutation.mutate()}
                    disabled={!portalEmail || !portalPassword || portalMutation.isPending}
                  >
                    {portalMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button asChild>
            <Link href={`/tedarikciler/${id}/duzenle`}>
              <Edit className="w-4 h-4 mr-2" />
              Düzenle
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Firma Bilgileri */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Firma Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Vergi No</p>
              <p className="font-medium">{supplier.vergiNo || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Vergi Dairesi</p>
              <p className="font-medium">{supplier.vergiDairesi || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Telefon</p>
              <p className="font-medium">{supplier.telefon || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="font-medium">{supplier.email || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Adres</p>
              <p className="font-medium">{supplier.adres || "-"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Araçlar */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Araçlar
              <Badge variant="secondary">{supplier.vehicles.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {supplier.vehicles.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                Bu tedarikçiye ait araç bulunmuyor
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plaka</TableHead>
                    <TableHead>Marka/Model</TableHead>
                    <TableHead>Şoför</TableHead>
                    <TableHead>İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplier.vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.plaka}</TableCell>
                      <TableCell>
                        {vehicle.marka || "-"} {vehicle.model || ""}
                      </TableCell>
                      <TableCell>{vehicle.driver?.adSoyad || "-"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/araclar/${vehicle.id}`}>Detay</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
