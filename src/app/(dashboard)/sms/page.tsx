"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import {
  Send,
  Plus,
  X,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  History,
} from "lucide-react";

interface SmsLog {
  id: string;
  alici: string;
  aliciAdi: string | null;
  mesaj: string;
  durum: "PENDING" | "SENT" | "FAILED";
  saglayici: string | null;
  hata: string | null;
  tetikleyici: string | null;
  createdAt: string;
}

interface LogsResponse {
  logs: SmsLog[];
  counts: { SENT?: number; FAILED?: number; PENDING?: number };
}

interface Recipient {
  to: string;
  aliciAdi: string;
}

interface SuggestionContact {
  id: string;
  ad: string;
  telefon: string | null;
  type: "DRIVER" | "SUPPLIER";
}

async function fetchLogs(): Promise<LogsResponse> {
  const res = await fetch("/api/sms/logs?limit=200");
  if (!res.ok) throw new Error("SMS kayıtları alınamadı");
  return res.json();
}

async function fetchDriverContacts(): Promise<SuggestionContact[]> {
  const res = await fetch("/api/drivers");
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((d: { id: string; adSoyad: string; telefon: string | null }) => ({
    id: d.id,
    ad: d.adSoyad,
    telefon: d.telefon,
    type: "DRIVER" as const,
  }));
}

async function fetchSupplierContacts(): Promise<SuggestionContact[]> {
  const res = await fetch("/api/suppliers");
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((s: { id: string; firmaAdi: string; telefon: string | null }) => ({
    id: s.id,
    ad: s.firmaAdi,
    telefon: s.telefon,
    type: "SUPPLIER" as const,
  }));
}

async function sendSms(payload: {
  recipients: Recipient[];
  message: string;
}) {
  const res = await fetch("/api/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "SMS gönderilemedi");
  }
  return res.json();
}

export default function SmsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [phoneInput, setPhoneInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [message, setMessage] = useState("");
  const [contactTypeFilter, setContactTypeFilter] = useState<
    "ALL" | "DRIVER" | "SUPPLIER"
  >("ALL");

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ["sms-logs"],
    queryFn: fetchLogs,
  });

  const { data: driverContacts } = useQuery({
    queryKey: ["sms-drivers"],
    queryFn: fetchDriverContacts,
  });

  const { data: supplierContacts } = useQuery({
    queryKey: ["sms-suppliers"],
    queryFn: fetchSupplierContacts,
  });

  const allContacts: SuggestionContact[] = [
    ...(driverContacts ?? []),
    ...(supplierContacts ?? []),
  ];
  const filteredContacts =
    contactTypeFilter === "ALL"
      ? allContacts
      : allContacts.filter((c) => c.type === contactTypeFilter);

  const mutation = useMutation({
    mutationFn: sendSms,
    onSuccess: (data: { sent: number; failed: number }) => {
      queryClient.invalidateQueries({ queryKey: ["sms-logs"] });
      toast({
        title: "Gönderim tamamlandı",
        description: `${data.sent} başarılı, ${data.failed} başarısız.`,
      });
      setRecipients([]);
      setMessage("");
    },
    onError: (err: Error) => {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    },
  });

  const addRecipient = () => {
    if (!phoneInput.trim()) return;
    setRecipients((prev) => [
      ...prev,
      { to: phoneInput.trim(), aliciAdi: nameInput.trim() },
    ]);
    setPhoneInput("");
    setNameInput("");
  };

  const removeRecipient = (idx: number) => {
    setRecipients((prev) => prev.filter((_, i) => i !== idx));
  };

  const addContact = (c: SuggestionContact) => {
    if (!c.telefon) {
      toast({
        title: "Telefon yok",
        description: `${c.ad} için kayıtlı telefon yok.`,
        variant: "destructive",
      });
      return;
    }
    if (recipients.some((r) => r.to === c.telefon)) return;
    setRecipients((prev) => [...prev, { to: c.telefon!, aliciAdi: c.ad }]);
  };

  const handleSend = () => {
    if (recipients.length === 0) {
      toast({
        title: "Alıcı yok",
        description: "En az bir alıcı eklemelisiniz.",
        variant: "destructive",
      });
      return;
    }
    if (!message.trim()) {
      toast({
        title: "Mesaj boş",
        description: "Mesaj metni boş olamaz.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({ recipients, message: message.trim() });
  };

  const charCount = message.length;
  const smsCount = Math.max(1, Math.ceil(charCount / 160));

  const renderDurum = (durum: SmsLog["durum"]) => {
    if (durum === "SENT") {
      return (
        <Badge variant="success">
          <CheckCircle2 className="h-3 w-3" />
          Gönderildi
        </Badge>
      );
    }
    if (durum === "FAILED") {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3" />
          Başarısız
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3" />
        Bekliyor
      </Badge>
    );
  };

  const counts = logsData?.counts ?? {};

  return (
    <div>
      <PageHeader
        title="SMS"
        description="Sürücü, tedarikçi ve özel alıcılara toplu SMS gönderin, geçmişi takip edin."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Toplam Gönderilen</p>
            <p className="text-2xl font-bold">{counts.SENT ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Başarısız</p>
            <p className="text-2xl font-bold text-destructive">
              {counts.FAILED ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Bekleyen</p>
            <p className="text-2xl font-bold">{counts.PENDING ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="gonder">
        <TabsList>
          <TabsTrigger value="gonder">
            <Send className="w-4 h-4" />
            SMS Gönder
          </TabsTrigger>
          <TabsTrigger value="gecmis">
            <History className="w-4 h-4" />
            Geçmiş
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gonder" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mesaj</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    rows={5}
                    placeholder="Mesaj metnini yazın..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={800}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {charCount} karakter — {smsCount} SMS olarak ücretlendirilir
                    </span>
                    <span>Maks 800 karakter</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Alıcılar ({recipients.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input
                      placeholder="Telefon (5xx...)"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addRecipient();
                        }
                      }}
                    />
                    <Input
                      placeholder="Ad (opsiyonel)"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addRecipient();
                        }
                      }}
                    />
                    <Button onClick={addRecipient} variant="outline">
                      <Plus className="w-4 h-4" />
                      Ekle
                    </Button>
                  </div>

                  {recipients.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Henüz alıcı eklenmedi. Yandaki listeden seçebilir veya yukarıdan
                      manuel ekleyebilirsiniz.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {recipients.map((r, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="gap-2 pr-1"
                        >
                          <span>
                            {r.aliciAdi ? `${r.aliciAdi} — ` : ""}
                            {r.to}
                          </span>
                          <button
                            onClick={() => removeRecipient(idx)}
                            className="hover:bg-muted rounded p-0.5"
                            aria-label="Kaldır"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleSend}
                  disabled={mutation.isPending}
                  size="lg"
                >
                  <Send className="w-4 h-4" />
                  {mutation.isPending ? "Gönderiliyor..." : "Gönder"}
                </Button>
              </div>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Kişiler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Filtre</Label>
                    <Select
                      value={contactTypeFilter}
                      onValueChange={(v) =>
                        setContactTypeFilter(v as "ALL" | "DRIVER" | "SUPPLIER")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Tümü</SelectItem>
                        <SelectItem value="DRIVER">Şoförler</SelectItem>
                        <SelectItem value="SUPPLIER">Tedarikçiler</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="mt-4 space-y-1 max-h-96 overflow-y-auto">
                    {filteredContacts.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Kişi bulunamadı
                      </p>
                    ) : (
                      filteredContacts.map((c) => (
                        <button
                          key={`${c.type}-${c.id}`}
                          onClick={() => addContact(c)}
                          className="w-full text-left flex items-center justify-between gap-2 p-2 rounded hover:bg-muted text-sm transition-colors"
                          disabled={!c.telefon}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{c.ad}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {c.telefon ?? "Telefon yok"}
                            </p>
                          </div>
                          <Badge
                            variant={c.type === "DRIVER" ? "default" : "primary"}
                            className="shrink-0"
                          >
                            {c.type === "DRIVER" ? "Şoför" : "Tedarikçi"}
                          </Badge>
                        </button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gecmis" className="mt-6">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Alıcı</TableHead>
                  <TableHead>Mesaj</TableHead>
                  <TableHead>Tetikleyici</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  <TableSkeleton columns={5} />
                ) : logsData?.logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState
                        icon={Send}
                        title="Henüz SMS gönderilmedi"
                        description="Gönderdiğiniz SMS'ler burada listelenir."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  logsData?.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{log.aliciAdi || "—"}</div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {log.alici}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="truncate" title={log.mesaj}>
                          {log.mesaj}
                        </p>
                        {log.hata ? (
                          <p
                            className="truncate text-xs text-destructive mt-0.5"
                            title={log.hata}
                          >
                            {log.hata}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.tetikleyici ?? "MANUAL"}
                        </Badge>
                      </TableCell>
                      <TableCell>{renderDurum(log.durum)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
