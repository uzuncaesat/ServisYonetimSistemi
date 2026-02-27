"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (session.user?.role !== "SUPPLIER") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hakediş Raporlarım</h1>
        <p className="text-muted-foreground mt-1">
          Dönem seçerek raporunuzu görüntüleyebilir veya indirebilirsiniz.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Rapor Görüntüle / İndir
          </CardTitle>
          <CardDescription>
            Yönetici tarafından oluşturulan aylık hakediş raporunuzu buradan açabilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="flex items-end gap-2">
              <Button
                onClick={handleViewReport}
                disabled={loading}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                Görüntüle
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadReport}
                disabled={loading}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                İndir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
