"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Eye } from "lucide-react";

const monthNames = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function SupplierReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    if (session.user?.role !== "SUPPLIER" || !session.user?.supplierId) {
      router.push("/");
      return;
    }
  }, [session, status, router]);

  const handleViewReport = () => {
    const params = new URLSearchParams({
      yil: selectedYear.toString(),
      ay: selectedMonth.toString(),
      reportType: "supplier",
    });
    setLoading(true);
    window.open(`/api/reports/supplier?${params}`, "_blank", "noopener,noreferrer");
    setLoading(false);
  };

  const handleDownloadReport = async () => {
    const params = new URLSearchParams({
      yil: selectedYear.toString(),
      ay: selectedMonth.toString(),
      reportType: "supplier",
    });
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/supplier?${params}`);
      if (!res.ok) throw new Error("Rapor alınamadı");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tedarikci-raporu-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      // hata
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || !session) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">Yükleniyor…</div>
    );
  }

  if (session.user?.role !== "SUPPLIER") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Hakediş Raporlarım</h1>
        <p className="text-sm text-muted-foreground">
          Dönem seçerek raporunuzu görüntüleyebilir veya indirebilirsiniz.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Rapor Görüntüle / İndir
          </CardTitle>
          <CardDescription>
            Yönetici tarafından oluşturulan aylık hakediş raporunuza erişin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Yıl</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ay</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, idx) => (
                    <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={handleViewReport}
              disabled={loading}
              className="flex-1"
            >
              <Eye className="h-4 w-4" />
              Görüntüle
            </Button>
            <Button
              onClick={handleDownloadReport}
              disabled={loading}
              className="flex-1"
            >
              <Download className="h-4 w-4" />
              İndir
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
