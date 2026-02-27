"use client";

import { useState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download, Factory, Building2, Eye } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";
import { canGenerateFactoryReport } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";

interface Supplier {
  id: string;
  firmaAdi: string;
}

interface Project {
  id: string;
  ad: string;
}

async function fetchSuppliers(): Promise<Supplier[]> {
  const res = await fetch("/api/suppliers");
  if (!res.ok) throw new Error("Tedarikçiler yüklenemedi");
  return res.json();
}

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Projeler yüklenemedi");
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
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [reportType, setReportType] = useState<ReportType>("supplier");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    reportNo: string;
    reportTitle: string;
    period: string;
    supplier: { firmaAdi: string; vergiNo: string | null; vergiDairesi: string | null };
    isProjectReport?: boolean;
    summaryRows: Array<{ plaka: string; proje: string; guzergah: string; km: string; sefer: string; birimFiyat: string; toplam: string; kdv: string }>;
    extraWorkRows: Array<{ tarih: string; proje: string; plaka: string; aciklama: string; tutar: string }>;
    puantajTotal: number;
    extraWorkTotal: number;
    grandTotal: number;
    grandKdv: number;
    grandAraToplam: number;
    grandTevkifat: number;
    grandFatura: number;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (!canGenerateFactory && reportType === "factory") {
      setReportType("supplier");
      setSelectedProjectId("");
    }
  }, [canGenerateFactory, reportType]);

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: fetchSuppliers,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const handlePreview = async () => {
    if (reportType === "supplier" && !selectedSupplierId) {
      toast({ title: "Hata", description: "Lütfen bir tedarikçi seçin", variant: "destructive" });
      return;
    }
    if (reportType === "factory") {
      if (!canGenerateFactory) {
        toast({ title: "Hata", description: "Bu raporu oluşturma yetkiniz yok", variant: "destructive" });
        return;
      }
      if (!selectedProjectId) {
        toast({ title: "Hata", description: "Lütfen bir proje seçin", variant: "destructive" });
        return;
      }
    }
    setPreviewLoading(true);
    setPreviewOpen(true);
    try {
      const params = new URLSearchParams({
        yil: selectedYear.toString(),
        ay: selectedMonth.toString(),
        reportType,
        preview: "1",
      });
      if (reportType === "factory") params.set("projectId", selectedProjectId);
      else params.set("supplierId", selectedSupplierId);
      const res = await fetch(`/api/reports/supplier?${params}`);
      if (!res.ok) throw new Error("Önizleme alınamadı");
      const data = await res.json();
      setPreviewData(data);
    } catch {
      setPreviewData(null);
      toast({ title: "Hata", description: "Önizleme yüklenemedi", variant: "destructive" });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (reportType === "supplier" && !selectedSupplierId) {
      toast({ title: "Hata", description: "Lütfen bir tedarikçi seçin", variant: "destructive" });
      return;
    }
    if (reportType === "factory") {
      if (!canGenerateFactory) {
        toast({ title: "Hata", description: "Bu raporu oluşturma yetkiniz yok", variant: "destructive" });
        return;
      }
      if (!selectedProjectId) {
        toast({ title: "Hata", description: "Lütfen bir proje seçin", variant: "destructive" });
        return;
      }
    }

    setIsGenerating(true);
    try {
      const params = new URLSearchParams({
        yil: selectedYear.toString(),
        ay: selectedMonth.toString(),
        reportType,
      });
      if (reportType === "factory") params.set("projectId", selectedProjectId);
      else params.set("supplierId", selectedSupplierId);
      const response = await fetch(`/api/reports/supplier?${params}`);

      if (!response.ok) {
        throw new Error("Rapor oluşturulamadı");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const prefix = reportType === "factory" ? "fabrika-raporu" : "tedarikci-raporu";
      const suffix = reportType === "factory" ? (projects?.find((p) => p.id === selectedProjectId)?.ad ?? selectedProjectId) : (suppliers?.find((s) => s.id === selectedSupplierId)?.firmaAdi ?? "");
      a.download = `${prefix}-${suffix}-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.pdf`.replace(/[^a-zA-Z0-9.-]/g, "_");
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: "Rapor oluşturuldu ve indirildi" });

      // Tedarikçi raporunda tedarikçiye bildirim (fabrika/proje raporunda bildirim yok)
      if (reportType === "supplier" && selectedSupplierId) {
        try {
          await fetch("/api/notifications/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "REPORT_READY",
              title: "Rapor Hazır",
              message: `${monthNames[selectedMonth - 1]} ${selectedYear} dönemi tedarikçi raporunuz hazırlandı.`,
              targetSupplierId: selectedSupplierId,
            }),
          });
        } catch {
          // Bildirim gönderilmese bile rapor başarılı
        }
      }
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
                    onClick={() => {
                      setReportType("supplier");
                      setSelectedProjectId("");
                    }}
                    className="justify-start"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Tedarikçi Raporu
                  </Button>
                  {canGenerateFactory && (
                    <Button
                      type="button"
                      variant={reportType === "factory" ? "default" : "outline"}
                      onClick={() => {
                        setReportType("factory");
                        setSelectedSupplierId("");
                      }}
                      className="justify-start bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                    >
                      <Factory className="w-4 h-4 mr-2" />
                      Fabrika Raporu
                    </Button>
                  )}
                </div>
                {reportType === "factory" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Fabrika raporu projeye göre oluşturulur, fabrika fiyatları üzerinden hesaplanır.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{reportType === "factory" ? "Proje" : "Tedarikçi"}</Label>
                {reportType === "factory" ? (
                  <Select
                    value={selectedProjectId}
                    onValueChange={setSelectedProjectId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Proje seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.ad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
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
                )}
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

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  disabled={(reportType === "supplier" ? !selectedSupplierId : !selectedProjectId) || previewLoading}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {previewLoading ? "Yükleniyor..." : "Önizleme"}
                </Button>
                <Button
                  onClick={handleGenerateReport}
                  disabled={(reportType === "supplier" ? !selectedSupplierId : !selectedProjectId) || isGenerating}
                  className={`flex-1 ${reportType === "factory" ? "bg-amber-500 hover:bg-amber-600" : ""}`}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isGenerating ? "Oluşturuluyor..." : "PDF İndir"}
                </Button>
              </div>
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

      {/* Rapor Önizleme Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {previewData?.reportTitle} - Önizleme
            </DialogTitle>
          </DialogHeader>
          {previewLoading ? (
            <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
          ) : previewData ? (
            <div className="space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-muted-foreground">Rapor No / Dönem</p>
                  <p className="font-semibold">{previewData.reportNo} · {previewData.period}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">{previewData.isProjectReport ? "Proje" : "Tedarikçi"}</p>
                  <p className="font-semibold">{previewData.supplier.firmaAdi}</p>
                  {!previewData.isProjectReport && (previewData.supplier.vergiNo || previewData.supplier.vergiDairesi) && (
                    <p className="text-muted-foreground">
                      V.No: {previewData.supplier.vergiNo || "-"} · {previewData.supplier.vergiDairesi || "-"}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Puantaj Özeti</h4>
                {previewData.summaryRows.length > 0 ? (
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plaka</TableHead>
                          <TableHead>Proje</TableHead>
                          <TableHead>Güzergah</TableHead>
                          <TableHead>KM</TableHead>
                          <TableHead>Sefer</TableHead>
                          <TableHead>Birim Fiyat</TableHead>
                          <TableHead>Toplam</TableHead>
                          <TableHead>KDV</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.summaryRows.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell>{row.plaka}</TableCell>
                            <TableCell>{row.proje}</TableCell>
                            <TableCell>{row.guzergah}</TableCell>
                            <TableCell>{row.km}</TableCell>
                            <TableCell>{row.sefer}</TableCell>
                            <TableCell>{row.birimFiyat}</TableCell>
                            <TableCell>{row.toplam}</TableCell>
                            <TableCell>{row.kdv}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Bu dönem için puantaj kaydı yok.</p>
                )}
                {previewData.summaryRows.length > 0 && (
                  <p className="text-right font-medium mt-2">Puantaj Toplam: {formatCurrency(previewData.puantajTotal)}</p>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Ek İş / Mesai</h4>
                {previewData.extraWorkRows.length > 0 ? (
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tarih</TableHead>
                          <TableHead>Proje</TableHead>
                          <TableHead>Plaka</TableHead>
                          <TableHead>Açıklama</TableHead>
                          <TableHead>Tutar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.extraWorkRows.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell>{row.tarih}</TableCell>
                            <TableCell>{row.proje}</TableCell>
                            <TableCell>{row.plaka}</TableCell>
                            <TableCell>{row.aciklama}</TableCell>
                            <TableCell>{row.tutar}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Bu dönem için ek iş kaydı yok.</p>
                )}
              </div>

              <div className="p-4 bg-primary/10 rounded-lg space-y-1">
                <p className="flex justify-between"><span>Toplam (Net)</span><span>{formatCurrency(previewData.grandTotal)}</span></p>
                <p className="flex justify-between"><span>KDV (%20)</span><span>{formatCurrency(previewData.grandKdv)}</span></p>
                <p className="flex justify-between"><span>Ara Toplam</span><span>{formatCurrency(previewData.grandAraToplam)}</span></p>
                <p className="flex justify-between text-red-600"><span>Tevkifat (5/10)</span><span>-{formatCurrency(previewData.grandTevkifat)}</span></p>
                <p className="flex justify-between font-bold text-lg pt-2"><span>Fatura Tutarı</span><span>{formatCurrency(previewData.grandFatura)}</span></p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">Önizleme yüklenemedi.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
