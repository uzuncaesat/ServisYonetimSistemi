"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VehicleExpenseFormData } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/layout/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

import { ExpenseForm } from "@/components/expense/expense-form";

interface Vehicle {
  id: string;
  plaka: string;
  marka: string | null;
  model: string | null;
}

async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await fetch("/api/vehicles");
  if (!res.ok) throw new Error("Araçlar alınamadı");
  return res.json();
}

async function createExpense(data: VehicleExpenseFormData) {
  const res = await fetch("/api/vehicle-expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Oluşturulamadı");
  }
  return res.json();
}

export default function NewExpensePage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
  });

  const mutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-expenses"] });
      toast({ title: "Gider kaydedildi" });
      router.push("/giderler");
    },
    onError: (err: Error) => {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <BackButton fallbackHref="/giderler" />
        <div>
          <h1 className="text-2xl font-bold">Yeni Gider</h1>
          <p className="text-muted-foreground">Araç gideri kaydedin</p>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Gider Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            vehicles={vehicles ?? []}
            onSubmit={(data) => mutation.mutate(data)}
            isPending={mutation.isPending}
            submitLabel="Kaydet"
            cancelHref="/giderler"
          />
        </CardContent>
      </Card>
    </div>
  );
}
