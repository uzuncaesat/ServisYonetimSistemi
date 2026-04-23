"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Download, Eye, Trash2, FileText, AlertCircle, MoreHorizontal } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { vehicleDocTypes, driverDocTypes } from "@/lib/validations";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Document {
  id: string;
  docType: string;
  title: string;
  fileName: string;
  fileSize: number;
  validTo: string | null;
  createdAt: string;
}

interface DocumentListProps {
  ownerType: "VEHICLE" | "DRIVER";
  ownerId: string;
}

async function fetchDocuments(ownerType: string, ownerId: string): Promise<Document[]> {
  const res = await fetch(`/api/documents?ownerType=${ownerType}&ownerId=${ownerId}`);
  if (!res.ok) throw new Error("Evraklar yüklenemedi");
  return res.json();
}

async function deleteDocument(id: string) {
  const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Evrak silinemedi");
  return res.json();
}

async function uploadDocument(formData: FormData) {
  const res = await fetch("/api/documents/upload", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Evrak yüklenemedi");
  }
  return res.json();
}

export function DocumentList({ ownerType, ownerId }: DocumentListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState({
    docType: "",
    title: "",
    validFrom: "",
    validTo: "",
    file: null as File | null,
  });

  const docTypes = ownerType === "VEHICLE" ? vehicleDocTypes : driverDocTypes;

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents", ownerType, ownerId],
    queryFn: () => fetchDocuments(ownerType, ownerId),
  });

  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", ownerType, ownerId] });
      toast({ title: "Evrak yüklendi" });
      setIsUploadOpen(false);
      setUploadData({ docType: "", title: "", validFrom: "", validTo: "", file: null });
    },
    onError: (error: Error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", ownerType, ownerId] });
      toast({ title: "Evrak silindi" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Hata", description: "Evrak silinemedi", variant: "destructive" });
    },
  });

  const handleUpload = () => {
    if (!uploadData.file || !uploadData.docType || !uploadData.title) {
      toast({ title: "Hata", description: "Tüm zorunlu alanları doldurun", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadData.file);
    formData.append("ownerType", ownerType);
    formData.append("ownerId", ownerId);
    formData.append("docType", uploadData.docType);
    formData.append("title", uploadData.title);
    if (uploadData.validFrom) formData.append("validFrom", uploadData.validFrom);
    if (uploadData.validTo) formData.append("validTo", uploadData.validTo);

    uploadMutation.mutate(formData);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getDocTypeLabel = (docType: string) => {
    const type = docTypes.find((t) => t.value === docType);
    return type?.label || docType;
  };

  const isExpiringSoon = (validTo: string | null) => {
    if (!validTo) return false;
    const expiryDate = new Date(validTo);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (validTo: string | null) => {
    if (!validTo) return false;
    return new Date(validTo) < new Date();
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Evrak Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Evrak Yükle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Evrak Türü *</Label>
                <Select
                  value={uploadData.docType}
                  onValueChange={(value) =>
                    setUploadData((prev) => ({ ...prev, docType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Evrak türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {docTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Başlık *</Label>
                <Input
                  value={uploadData.title}
                  onChange={(e) =>
                    setUploadData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Evrak başlığı"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Geçerlilik Başlangıcı</Label>
                  <Input
                    type="date"
                    value={uploadData.validFrom}
                    onChange={(e) =>
                      setUploadData((prev) => ({ ...prev, validFrom: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Geçerlilik Bitişi</Label>
                  <Input
                    type="date"
                    value={uploadData.validTo}
                    onChange={(e) =>
                      setUploadData((prev) => ({ ...prev, validTo: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>PDF Dosyası *</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) =>
                    setUploadData((prev) => ({
                      ...prev,
                      file: e.target.files?.[0] || null,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">Maksimum 20MB, sadece PDF</p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                  İptal
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? "Yükleniyor..." : "Yükle"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!isLoading && documents?.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Henüz evrak yok"
          description="Yüklediğiniz evraklar burada listelenir."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evrak</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Boyut</TableHead>
                <TableHead>Geçerlilik</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead className="w-[60px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton columns={6} />
              ) : (
                documents?.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{doc.title}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {doc.fileName}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getDocTypeLabel(doc.docType)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {formatFileSize(doc.fileSize)}
                    </TableCell>
                    <TableCell>
                      {doc.validTo ? (
                        isExpired(doc.validTo) ? (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3" />
                            Süresi Dolmuş
                          </Badge>
                        ) : isExpiringSoon(doc.validTo) ? (
                          <Badge variant="warning">
                            <AlertCircle className="h-3 w-3" />
                            {formatDate(doc.validTo)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            {formatDate(doc.validTo)}
                          </span>
                        )
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(doc.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(`/api/documents/${doc.id}/preview`, "_blank")
                            }
                          >
                            <Eye /> Önizle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = `/api/documents/${doc.id}/download`;
                              link.download = doc.fileName;
                              link.click();
                            }}
                          >
                            <Download /> İndir
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(doc.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="text-destructive" /> Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Evrakı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu evrakı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
