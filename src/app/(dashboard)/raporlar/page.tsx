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
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Factory, Building2, Eye, Truck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";
import { canGenerateFactoryReport } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

type ReportType = "supplier" | "factory" | "vehicle";

interface VehicleOption {
  id: string;
  plaka: string;
}

async function fetchVehiclesForReport(): Promise<VehicleOption[]> {
  const res = await fetch("/api/vehicles");
  if (!res.ok) throw new Error("Araçlar yüklenemedi");
  const data = (await res.json()) as VehicleOption[];
  return data;
}

interface VehicleProjectOption {
  id: string;
  ad: string;
}

async function fetchVehicleProjects(vehicleId: string): Promise<VehicleProjectOption[]> {
  const res = await fetch(`/api/vehicles/${vehicleId}`);
  if (!res.ok) throw new Error("Araç projeleri yüklenemedi");
  const data = await res.json() as {
    projects: Array<{ project: { id: string; ad: string } }>;
  };
  return data.projects.map((p) => ({ id: p.project.id, ad: p.project.ad }));
}

export default function ReportsPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const canGenerateFactory = canGenerateFactoryReport(session?.user?.role);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedVehicleReportId, setSelectedVehicleReportId] = useState<string>("");
  const [selectedVehicleProjectIds, setSelectedVehicleProjectIds] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [reportType, setReportType] = useState<ReportType>("supplier");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    reportNo: string;
    reportTitle: string;
    reportKind?: "supplier" | "factory" | "vehicle";
    period: string;
    supplier: { firmaAdi: string; vergiNo: string | null; vergiDairesi: string | null };
    isProjectReport?: boolean;
    filteredVehiclePlaka?: string | null;
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
    if (!canGenerateFactory && (reportType === "factory" || reportType === "vehicle")) {
      setReportType("supplier");
      setSelectedProjectId("");
      setSelectedVehicleReportId("");
      setSelectedVehicleProjectIds([]);
    }
  }, [canGenerateFactory, reportType]);

  useEffect(() => {
    setSelectedSupplierId("");
    setSelectedProjectId("");
    setSelectedVehicleReportId("");
    setSelectedVehicleProjectIds([]);
  }, [reportType]);

  useEffect(() => {
    setSelectedVehicleProjectIds([]);
  }, [selectedVehicleReportId]);
  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: fetchSuppliers,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const { data: vehiclesForReport } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehiclesForReport,
    enabled: reportType === "vehicle",
  });

  const { data: vehicleProjects } = useQuery({
    queryKey: ["vehicle-projects", selectedVehicleReportId],
    queryFn: () => fetchVehicleProjects(selectedVehicleReportId),
    enabled: reportType === "vehicle" && !!selectedVehicleReportId,
  });

  useEffect(() => {
    if (vehicleProjects?.length) {
      setSelectedVehicleProjectIds(vehicleProjects.map((p) => p.id));
    }
  }, [vehicleProjects]);

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
    if (reportType === "vehicle") {
      if (!canGenerateFactory) {
        toast({ title: "Hata", description: "Bu raporu oluşturma yetkiniz yok", variant: "destructive" });
        return;
      }
      if (!selectedVehicleReportId) {
        toast({ title: "Hata", description: "Lütfen bir araç (plaka) seçin", variant: "destructive" });
        return;
      }
      if (selectedVehicleProjectIds.length === 0) {
        toast({ title: "Hata", description: "En az bir proje seçin", variant: "destructive" });
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
      if (reportType === "factory") {
        params.set("projectId", selectedProjectId);
      } else if (reportType === "vehicle") {
        params.set("vehicleId", selectedVehicleReportId);
        params.set("projectIds", selectedVehicleProjectIds.join(","));
      } else {
        params.set("supplierId", selectedSupplierId);
      }
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
    if (reportType === "vehicle") {
      if (!canGenerateFactory) {
        toast({ title: "Hata", description: "Bu raporu oluşturma yetkiniz yok", variant: "destructive" });
        return;
      }
      if (!selectedVehicleReportId) {
        toast({ title: "Hata", description: "Lütfen bir araç (plaka) seçin", variant: "destructive" });
        return;
      }
      if (selectedVehicleProjectIds.length === 0) {
        toast({ title: "Hata", description: "En az bir proje seçin", variant: "destructive" });
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
      if (reportType === "factory") {
        params.set("projectId", selectedProjectId);
      } else if (reportType === "vehicle") {
        params.set("vehicleId", selectedVehicleReportId);
        params.set("projectIds", selectedVehicleProjectIds.join(","));
      } else {
        params.set("supplierId", selectedSupplierId);
      }
      const response = await fetch(`/api/reports/supplier?${params}`);

      if (!response.ok) {
        throw new Error("Rapor oluşturulamadı");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const prefix =
        reportType === "factory"
          ? "fabrika-raporu"
          : reportType === "vehicle"
            ? "arac-raporu"
            : "tedarikci-raporu";
      const projectAd = projects?.find((p) => p.id === selectedProjectId)?.ad ?? selectedProjectId;
      const vehiclePlakaSel =
        reportType === "vehicle"
          ? vehiclesForReport?.find((v) => v.id === selectedVehicleReportId)?.plaka
          : "";
      const suffix =
        reportType === "factory"
          ? projectAd
          : reportType === "vehicle"
            ? vehiclePlakaSel ?? ""
            : (suppliers?.find((s) => s.id === selectedSupplierId)?.firmaAdi ?? "");
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

  const reportSelectionReady =
    reportType === "supplier"
      ? !!selectedSupplierId
      : reportType === "factory"
        ? !!selectedProjectId
        : !!selectedVehicleReportId && selectedVehicleProjectIds.length > 0;

  const toggleVehicleProject = (projectId: string, checked: boolean) => {
    setSelectedVehicleProjectIds((prev) =>
      checked ? [...prev, projectId] : prev.filter((id) => id !== projectId)
    );
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
              <FileText className="h-4 w-4 text-muted-foreground" />
              Hakediş Raporu Oluştur
            </CardTitle>
            <CardDescription>
              Tedarikçi, fabrika (proje) veya seçilen tek araca göre rapor oluşturun.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Report Type Selection */}
              <div className="space-y-2">
                <Label>Rapor Tipi</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Button
                    type="button"
                    variant={reportType === "supplier" ? "default" : "outline"}
                    onClick={() => setReportType("supplier")}
                    className="justify-start"
                  >
                    <Building2 className="h-4 w-4 shrink-0" />
                    Tedarikçi
                  </Button>
                  {canGenerateFactory && (
                    <>
                      <Button
                        type="button"
                        variant={reportType === "factory" ? "default" : "outline"}
                        onClick={() => setReportType("factory")}
                        className="justify-start"
                      >
                        <Factory className="h-4 w-4 shrink-0" />
                        Fabrika
                        <Badge variant="outline" className="ml-auto text-[10px]">
                          Admin
                        </Badge>
                      </Button>
                      <Button
                        type="button"
                        variant={reportType === "vehicle" ? "default" : "outline"}
                        onClick={() => setReportType("vehicle")}
                        className="justify-start"
                      >
                        <Truck className="h-4 w-4 shrink-0" />
                        Araç
                        <Badge variant="outline" className="ml-auto text-[10px]">
                          Admin
                        </Badge>
                      </Button>
                    </>
                  )}
                </div>
                {reportType === "factory" && (
                  <p className="text-xs text-muted-foreground">
                    Fabrika: Projedeki tüm araçlar, fabrika fiyatlarıyla.
                  </p>
                )}
                {reportType === "vehicle" && (
                  <p className="text-xs text-muted-foreground">
                    Araç: Seçilen plaka ve projeler; puantaj ve ek işler tedarikçi birim fiyatlarıyla özetlenir.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                {reportType === "supplier" ? (
                  <>
                    <Label>Tedarikçi</Label>
                    <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
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
                  </>
                ) : reportType === "factory" ? (
                  <>
                    <Label>Proje</Label>
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
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
                  </>
                ) : (
                  <>
                    <Label className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                      Araç (plaka)
                    </Label>
                    <Select
                      value={selectedVehicleReportId}
                      onValueChange={setSelectedVehicleReportId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Plaka seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehiclesForReport?.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.plaka}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedVehicleReportId && (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <Label>Projeler</Label>
                          {vehicleProjects && vehicleProjects.length > 0 && (
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="link"
                                className="h-auto p-0 text-xs"
                                onClick={() =>
                                  setSelectedVehicleProjectIds(
                                    vehicleProjects.map((p) => p.id)
                                  )
                                }
                              >
                                Tümünü seç
                              </Button>
                              <Button
                                type="button"
                                variant="link"
                                className="h-auto p-0 text-xs"
                                onClick={() => setSelectedVehicleProjectIds([])}
                              >
                                Temizle
                              </Button>
                            </div>
                          )}
                        </div>
                        {!vehicleProjects?.length ? (
                          <p className="text-xs text-muted-foreground">
                            Bu araç henüz bir projeye atanmamış.
                          </p>
                        ) : (
                          <div className="max-h-40 overflow-y-auto rounded-md border p-3 space-y-2">
                            {vehicleProjects.map((p) => (
                              <div key={p.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`vehicle-project-${p.id}`}
                                  checked={selectedVehicleProjectIds.includes(p.id)}
                                  onCheckedChange={(checked) =>
                                    toggleVehicleProject(p.id, checked === true)
                                  }
                                />
                                <Label
                                  htmlFor={`vehicle-project-${p.id}`}
                                  className="cursor-pointer text-sm font-normal"
                                >
                                  {p.ad}
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
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

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  disabled={!reportSelectionReady || previewLoading}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4" />
                  {previewLoading ? "Yükleniyor..." : "Önizleme"}
                </Button>
                <Button
                  onClick={handleGenerateReport}
                  disabled={!reportSelectionReady || isGenerating}
                  className="flex-1"
                >
                  <Download className="h-4 w-4" />
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
            <CardDescription>PDF raporda yer alan bölümler.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              {[
                { title: "Rapor Bilgileri", desc: "Rapor numarası, tarihi ve dönemi." },
                { title: "Tedarikçi Bilgileri", desc: "Firma adı, vergi no ve vergi dairesi." },
                { title: "Özet Tablo", desc: "Araç, proje, güzergah bazlı sefer ve tutar özeti." },
                { title: "Hesaplama", desc: "Toplam · KDV (%20) · Ara Toplam · Tevkifat (5/10) · Fatura tutarı." },
                { title: "Günlük Detay", desc: "Tarih bazlı tüm sefer kayıtları." },
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-xs font-medium text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
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
            <div className="py-8 text-center text-sm text-muted-foreground">Yükleniyor…</div>
          ) : previewData ? (
            <div className="space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/30 p-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Rapor No / Dönem
                  </p>
                  <p className="mt-1 font-medium text-foreground">
                    {previewData.reportNo} · {previewData.period}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {previewData.reportKind === "vehicle"
                      ? "Plaka"
                      : previewData.reportKind === "factory" ||
                          (!previewData.reportKind && previewData.isProjectReport)
                        ? "Proje"
                        : "Tedarikçi"}
                  </p>
                  <p className="mt-1 font-medium text-foreground">{previewData.supplier.firmaAdi}</p>
                  {(previewData.reportKind === "supplier" ||
                    previewData.reportKind === "vehicle" ||
                    (!previewData.reportKind && !previewData.isProjectReport)) &&
                    (previewData.supplier.vergiNo || previewData.supplier.vergiDairesi) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        V.No: {previewData.supplier.vergiNo || "-"} ·{" "}
                        {previewData.supplier.vergiDairesi || "-"}
                      </p>
                    )}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium text-foreground">Puantaj Özeti</h4>
                {previewData.summaryRows.length > 0 ? (
                  <div className="overflow-x-auto rounded-md border border-border">
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
                  <p className="text-sm text-muted-foreground">Bu dönem için puantaj kaydı yok.</p>
                )}
                {previewData.summaryRows.length > 0 && (
                  <p className="mt-2 text-right text-sm">
                    <span className="text-muted-foreground">Puantaj Toplam: </span>
                    <span className="font-medium text-foreground">{formatCurrency(previewData.puantajTotal)}</span>
                  </p>
                )}
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium text-foreground">Ek İş / Mesai</h4>
                {previewData.extraWorkRows.length > 0 ? (
                  <div className="overflow-x-auto rounded-md border border-border">
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
                  <p className="text-sm text-muted-foreground">Bu dönem için ek iş kaydı yok.</p>
                )}
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <div className="space-y-1.5">
                  <p className="flex justify-between"><span className="text-muted-foreground">Toplam (Net)</span><span className="font-medium text-foreground">{formatCurrency(previewData.grandTotal)}</span></p>
                  <p className="flex justify-between"><span className="text-muted-foreground">KDV (%20)</span><span className="font-medium text-foreground">{formatCurrency(previewData.grandKdv)}</span></p>
                  <p className="flex justify-between"><span className="text-muted-foreground">Ara Toplam</span><span className="font-medium text-foreground">{formatCurrency(previewData.grandAraToplam)}</span></p>
                  <p className="flex justify-between"><span className="text-muted-foreground">Tevkifat (5/10)</span><span className="font-medium text-destructive">-{formatCurrency(previewData.grandTevkifat)}</span></p>
                </div>
                <Separator className="my-3" />
                <p className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-foreground">Fatura Tutarı</span>
                  <span className="text-lg font-semibold text-primary">{formatCurrency(previewData.grandFatura)}</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">Önizleme yüklenemedi.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
