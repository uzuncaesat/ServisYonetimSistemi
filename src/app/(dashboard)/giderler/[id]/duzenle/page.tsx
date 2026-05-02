"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VehicleExpenseFormData } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import { ExpenseForm } from "@/components/expense/expense-form";

interface Vehicle {
  id: string;
  plaka: string;
  marka: string | null;
  model: string | null;
}

interface Expense {
  id: string;
  vehicleId: string;
  tarih: string;
  kategori: string;
  altKategori: string | null;
  tutar: number;
  kdvDahil: boolean;
  km: number | null;
  saglayici: string | null;
  belgeNo: string | null;
  garantiBitis: string | null;
  notlar: string | null;
  fisUrl: string | null;
}

async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await fetch("/api/vehicles");
  if (!res.ok) throw new Error("Araçlar alınamadı");
  return res.json();
}

async function fetchExpense(id: string): Promise<Expense> {
  const res = await fetch(`/api/vehicle-expenses/${id}`);
  if (!res.ok) throw new Error("Gider alınamadı");
  return res.json();
}

async function updateExpense(id: string, data: VehicleExpenseFormData) {
  const res = await fetch(`/api/vehicle-expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Güncellenemedi");
  }
  return res.json();
}

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expense, isLoading } = useQuery({
    queryKey: ["vehicle-expense", id],
    queryFn: () => fetchExpense(id),
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
  });

  const mutation = useMutation({
    mutationFn: (data: VehicleExpenseFormData) => updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-expense", id] });
      toast({ title: "Gider güncellendi" });
      router.push("/giderler");
    },
    onError: (err: Error) => {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading || !expense) {
    return <div className="p-8 text-center">Yükleniyor...</div>;
  }

  const defaultValues = {
    vehicleId: expense.vehicleId,
    tarih: expense.tarih.slice(0, 10),
    kategori: expense.kategori as VehicleExpenseFormData["kategori"],
    altKategori: expense.altKategori ?? "",
    tutar: expense.tutar,
    kdvDahil: expense.kdvDahil,
    km: expense.km ?? undefined,
    saglayici: expense.saglayici ?? "",
    belgeNo: expense.belgeNo ?? "",
    garantiBitis: expense.garantiBitis ? expense.garantiBitis.slice(0, 10) : "",
    notlar: expense.notlar ?? "",
    fisUrl: expense.fisUrl ?? "",
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/giderler">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Gideri Düzenle</h1>
          <p className="text-muted-foreground">{expense.tarih.slice(0, 10)}</p>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Gider Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            vehicles={vehicles ?? []}
            defaultValues={defaultValues}
            onSubmit={(data) => mutation.mutate(data)}
            isPending={mutation.isPending}
            submitLabel="Güncelle"
            cancelHref="/giderler"
          />
        </CardContent>
      </Card>
    </div>
  );
}
