"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Edit, Car, User, Building2, FolderKanban, FileText } from "lucide-react";
import Link from "next/link";
import { DocumentList } from "@/components/documents/document-list";

interface VehicleDetail {
  id: string;
  plaka: string;
  marka: string | null;
  model: string | null;
  kisiSayisi: number | null;
  supplier: {
    id: string;
    firmaAdi: string;
    telefon: string | null;
  };
  driver: {
    id: string;
    adSoyad: string;
    telefon: string | null;
  } | null;
  projects: Array<{
    id: string;
    project: {
      id: string;
      ad: string;
    };
    vehicleRoutes: Array<{
      route: {
        id: string;
        ad: string;
        birimFiyat: number;
      };
    }>;
  }>;
  documents: Array<{
    id: string;
    docType: string;
    title: string;
    fileName: string;
    validTo: string | null;
    createdAt: string;
  }>;
  timesheets: Array<{
    id: string;
    yil: number;
    ay: number;
    project: {
      ad: string;
    };
  }>;
}

async function fetchVehicle(id: string): Promise<VehicleDetail> {
  const res = await fetch(`/api/vehicles/${id}`);
  if (!res.ok) throw new Error("Araç bulunamadı");
  return res.json();
}

export default function VehicleDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => fetchVehicle(id),
  });

  if (isLoading) {
    return <div className="p-8 text-center">Yükleniyor...</div>;
  }

  if (!vehicle) {
    return <div className="p-8 text-center">Araç bulunamadı</div>;
  }

  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/araclar">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Car className="w-6 h-6" />
              {vehicle.plaka}
            </h1>
            <p className="text-slate-500">
              {vehicle.marka} {vehicle.model}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/araclar/${id}/duzenle`}>
            <Edit className="w-4 h-4 mr-2" />
            Düzenle
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="bilgiler">
        <TabsList>
          <TabsTrigger value="bilgiler">Bilgiler</TabsTrigger>
          <TabsTrigger value="projeler">
            Projeler
            <Badge variant="secondary" className="ml-2">
              {vehicle.projects.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="evraklar">
            Evraklar
            <Badge variant="secondary" className="ml-2">
              {vehicle.documents.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bilgiler" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Araç Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Araç Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Plaka</p>
                  <p className="font-medium">{vehicle.plaka}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Marka / Model</p>
                  <p className="font-medium">
                    {vehicle.marka || "-"} {vehicle.model || ""}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Kişi Sayısı</p>
                  <p className="font-medium">{vehicle.kisiSayisi || "-"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Tedarikçi */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Tedarikçi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Firma Adı</p>
                  <Link
                    href={`/tedarikciler/${vehicle.supplier.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {vehicle.supplier.firmaAdi}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Telefon</p>
                  <p className="font-medium">{vehicle.supplier.telefon || "-"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Şoför */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Şoför
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vehicle.driver ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-500">Ad Soyad</p>
                      <Link
                        href={`/soforler/${vehicle.driver.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {vehicle.driver.adSoyad}
                      </Link>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Telefon</p>
                      <p className="font-medium">{vehicle.driver.telefon || "-"}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">
                    Şoför atanmamış
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Son Puantajlar */}
          {vehicle.timesheets.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Son Puantajlar</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dönem</TableHead>
                      <TableHead>Proje</TableHead>
                      <TableHead>İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicle.timesheets.map((ts) => (
                      <TableRow key={ts.id}>
                        <TableCell>
                          {monthNames[ts.ay - 1]} {ts.yil}
                        </TableCell>
                        <TableCell>{ts.project.ad}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/puantaj/${ts.id}`}>Görüntüle</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="projeler" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5" />
                Atanmış Projeler
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vehicle.projects.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  Bu araç henüz bir projeye atanmamış
                </p>
              ) : (
                <div className="space-y-4">
                  {vehicle.projects.map((pv) => (
                    <div key={pv.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Link
                          href={`/projeler/${pv.project.id}`}
                          className="font-medium text-lg text-primary hover:underline"
                        >
                          {pv.project.ad}
                        </Link>
                        <Badge variant="secondary">
                          {pv.vehicleRoutes.length} güzergah
                        </Badge>
                      </div>
                      {pv.vehicleRoutes.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium mb-1">Güzergahlar:</p>
                          <ul className="list-disc list-inside">
                            {pv.vehicleRoutes.map((vr) => (
                              <li key={vr.route.id}>
                                {vr.route.ad} - {vr.route.birimFiyat.toLocaleString("tr-TR")} ₺
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evraklar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Evraklar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentList ownerType="VEHICLE" ownerId={id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
