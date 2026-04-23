"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";

interface Project {
  id: string;
  ad: string;
}

interface Vehicle {
  id: string;
  plaka: string;
  supplier: { firmaAdi: string };
}

interface Timesheet {
  id: string;
  yil: number;
  ay: number;
  project: { id: string; ad: string };
  vehicle: {
    id: string;
    plaka: string;
    supplier: { id: string; firmaAdi: string };
  };
  entries: Array<{
    seferSayisi: number;
    birimFiyatSnapshot: number;
  }>;
}

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Projeler yüklenemedi");
  return res.json();
}

async function fetchProjectVehicles(
  projectId: string
): Promise<{ vehicle: Vehicle }[]> {
  const res = await fetch(`/api/projects/${projectId}/vehicles`);
  if (!res.ok) throw new Error("Araçlar yüklenemedi");
  return res.json();
}

async function fetchTimesheets(): Promise<Timesheet[]> {
  const res = await fetch("/api/timesheets");
  if (!res.ok) throw new Error("Puantajlar yüklenemedi");
  return res.json();
}

async function createTimesheet(data: {
  projectId: string;
  vehicleId: string;
  yil: number;
  ay: number;
}) {
  const res = await fetch("/api/timesheets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Puantaj oluşturulamadı");
  return res.json();
}

const monthNames = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function TimesheetPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const { data: projectVehicles } = useQuery({
    queryKey: ["project-vehicles", selectedProjectId],
    queryFn: () => fetchProjectVehicles(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const { data: timesheets, isLoading: timesheetsLoading } = useQuery({
    queryKey: ["timesheets"],
    queryFn: fetchTimesheets,
  });

  const createMutation = useMutation({
    mutationFn: createTimesheet,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      router.push(`/puantaj/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Puantaj oluşturulamadı",
        variant: "destructive",
      });
    },
  });

  const handleCreateTimesheet = () => {
    if (!selectedProjectId || !selectedVehicleId) {
      toast({
        title: "Eksik bilgi",
        description: "Proje ve araç seçimi zorunludur.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      projectId: selectedProjectId,
      vehicleId: selectedVehicleId,
      yil: selectedYear,
      ay: selectedMonth,
    });
  };

  const calculateTotal = (entries: Timesheet["entries"]) => {
    return entries.reduce(
      (sum, e) => sum + e.seferSayisi * e.birimFiyatSnapshot,
      0
    );
  };

  const hasTimesheets = (timesheets?.length ?? 0) > 0;

  return (
    <div>
      <PageHeader
        title="Puantaj"
        description="Aylık sefer kayıtlarını yönetin."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Yeni puantaj oluştur</CardTitle>
          <CardDescription>
            Proje ve araç seçerek ay için yeni bir puantaj açın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Proje</Label>
              <Select
                value={selectedProjectId}
                onValueChange={(value) => {
                  setSelectedProjectId(value);
                  setSelectedVehicleId("");
                }}
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
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Araç</Label>
              <Select
                value={selectedVehicleId}
                onValueChange={setSelectedVehicleId}
                disabled={!selectedProjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Araç seçin" />
                </SelectTrigger>
                <SelectContent>
                  {projectVehicles?.map((pv) => (
                    <SelectItem key={pv.vehicle.id} value={pv.vehicle.id}>
                      {pv.vehicle.plaka} — {pv.vehicle.supplier.firmaAdi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Yıl</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear - 1, currentYear, currentYear + 1].map(
                    (year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Ay</Label>
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

            <div className="flex items-end">
              <Button
                onClick={handleCreateTimesheet}
                disabled={
                  !selectedProjectId ||
                  !selectedVehicleId ||
                  createMutation.isPending
                }
                className="w-full"
              >
                {createMutation.isPending ? "Oluşturuluyor…" : "Puantaj aç"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold tracking-tight">
            Mevcut puantajlar
          </h2>
        </div>

        {!timesheetsLoading && !hasTimesheets ? (
          <EmptyState
            icon={ClipboardList}
            title="Henüz puantaj yok"
            description="Yukarıdan yeni bir puantaj oluşturun."
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dönem</TableHead>
                  <TableHead>Proje</TableHead>
                  <TableHead>Araç</TableHead>
                  <TableHead>Tedarikçi</TableHead>
                  <TableHead>Sefer</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead className="w-[60px] text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheetsLoading ? (
                  <TableSkeleton columns={7} />
                ) : (
                  timesheets?.map((ts) => {
                    const totalTrips = ts.entries.reduce(
                      (sum, e) => sum + e.seferSayisi,
                      0
                    );
                    const totalAmount = calculateTotal(ts.entries);
                    return (
                      <TableRow
                        key={ts.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/puantaj/${ts.id}`)}
                      >
                        <TableCell>
                          <Badge variant="default">
                            {monthNames[ts.ay - 1]} {ts.yil}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/projeler/${ts.project.id}`}
                            className="text-foreground hover:text-primary transition-colors"
                          >
                            {ts.project.ad}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">
                          {ts.vehicle.plaka}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {ts.vehicle.supplier.firmaAdi}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {totalTrips}
                        </TableCell>
                        <TableCell className="tabular-nums font-medium">
                          {formatCurrency(totalAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <ArrowRight className="h-4 w-4 text-muted-foreground inline-block" />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
