"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Edit, Building2, Car } from "lucide-react";
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

  const { data: supplier, isLoading } = useQuery({
    queryKey: ["supplier", id],
    queryFn: () => fetchSupplier(id),
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
        <Button asChild>
          <Link href={`/tedarikciler/${id}/duzenle`}>
            <Edit className="w-4 h-4 mr-2" />
            Düzenle
          </Link>
        </Button>
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
