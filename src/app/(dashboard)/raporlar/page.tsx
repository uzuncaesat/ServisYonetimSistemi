"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Download, Factory, Building2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";
import { canGenerateFactoryReport } from "@/lib/auth";

interface Supplier {
  id: string;
  firmaAdi: string;
}

async function fetchSuppliers(): Promise<Supplier[]> {
  const res = await fetch("/api/suppliers");
  if (!res.ok) throw new Error("Tedarikçiler yüklenemedi");
  return res.json();
}

const monthNames = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

type ReportType = "supplier" | "factory";

export default function ReportsPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const canGenerateFactory = canGenerateFactoryReport(session?.user?.role);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [reportType, setReportType] = useState<ReportType>("supplier");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: fetchSuppliers,
  });

  const handleGenerateReport = async () => {
    if (!selectedSupplierId) {
      toast({ title: "Hata", description: "Lütfen bir tedarikçi seçin", variant: "destructive" });
      return;
    }

    // Check if user has permission for factory report
    if (reportType === "factory" && !canGenerateFactory) {
      toast({ title: "Hata", description: "Bu raporu oluşturma yetkiniz yok", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(
        `/api/reports/supplier?supplierId=${selectedSupplierId}&yil=${selectedYear}&ay=${selectedMonth}&reportType=${reportType}`
      );

      if (!response.ok) {
        throw new Error("Rapor oluşturulamadı");
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const prefix = reportType === "factory" ? "fabrika-raporu" : "tedarikci-raporu";
      a.download = `${prefix}-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: "Rapor oluşturuldu ve indirildi" });
    } catch (error) {
      toast({ title: "Hata", description: "Rapor oluşturulamadı", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Raporlar"
        description="Tedarikçi hakedişlerini ve raporları oluşturun"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Hakediş Raporu Oluştur
            </CardTitle>
            <CardDescription>
              Seçilen tedarikçi için aylık hakediş raporu oluşturun
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Report Type Selection */}
              <div className="space-y-2">
                <Label>Rapor Tipi</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={reportType === "supplier" ? "default" : "outline"}
                    onClick={() => setReportType("supplier")}
                    className="justify-start"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Tedarikçi Raporu
                  </Button>
                  {canGenerateFactory && (
                    <Button
                      type="button"
                      variant={reportType === "factory" ? "default" : "outline"}
                      onClick={() => setReportType("factory")}
                      className="justify-start bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                    >
                      <Factory className="w-4 h-4 mr-2" />
                      Fabrika Raporu
                    </Button>
                  )}
                </div>
                {reportType === "factory" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Fabrika raporu, fabrika fiyatları üzerinden hesaplanır.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tedarikçi</Label>
                <Select
                  value={selectedSupplierId}
                  onValueChange={setSelectedSupplierId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tedarikçi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.firmaAdi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Yıl</Label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ay</Label>
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(value) => setSelectedMonth(parseInt(value))}
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

              <Button
                onClick={handleGenerateReport}
                disabled={!selectedSupplierId || isGenerating}
                className={`w-full ${reportType === "factory" ? "bg-amber-500 hover:bg-amber-600" : ""}`}
              >
                <Download className="w-4 h-4 mr-2" />
                {isGenerating ? "Oluşturuluyor..." : `PDF ${reportType === "factory" ? "Fabrika" : "Tedarikçi"} Raporu Oluştur`}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Rapor İçeriği</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <h4 className="font-medium text-slate-900">1. Rapor Bilgileri</h4>
                <p>Rapor numarası, tarihi ve dönemi</p>
              </div>
              <div>
                <h4 className="font-medium text-slate-900">2. Tedarikçi Bilgileri</h4>
                <p>Firma adı, vergi no ve vergi dairesi</p>
              </div>
              <div>
                <h4 className="font-medium text-slate-900">3. Özet Tablo</h4>
                <p>Araç, proje, güzergah bazlı sefer ve tutar özeti</p>
              </div>
              <div>
                <h4 className="font-medium text-slate-900">4. Hesaplama</h4>
                <ul className="list-disc list-inside ml-2">
                  <li>Toplam (Net)</li>
                  <li>KDV (%20)</li>
                  <li>Ara Toplam</li>
                  <li>Tevkifat (5/10)</li>
                  <li>Fatura Tutarı</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-900">5. Günlük Detay</h4>
                <p>Tarih bazlı tüm sefer kayıtları</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
