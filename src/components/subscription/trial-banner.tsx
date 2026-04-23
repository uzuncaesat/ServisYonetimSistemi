"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface OrgStatus {
  isActive: boolean;
  isTrialExpired: boolean;
  plan: string;
  daysRemaining: number | null;
  message?: string;
  planDetails: {
    name: string;
    monthlyPrice: number;
  };
}

async function fetchOrgStatus(): Promise<OrgStatus> {
  const res = await fetch("/api/organizations/status", { cache: "no-store" });
  if (!res.ok) throw new Error("Durum alınamadı");
  return res.json();
}

export function TrialBanner() {
  const { data: status } = useQuery({
    queryKey: ["org-status"],
    queryFn: fetchOrgStatus,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  if (!status) return null;
  if (status.plan !== "free") return null;

  if (status.isTrialExpired) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-foreground">
                Deneme süreniz doldu
              </h4>
              <p className="text-sm text-muted-foreground">
                {status.message ||
                  "Ücretsiz deneme süreniz sona erdi. Hizmetlerimize devam etmek için bir plan seçin."}
              </p>
            </div>
            <Button size="sm" variant="destructive" asChild>
              <Link href="/ayarlar/abonelik">
                <Sparkles className="h-3.5 w-3.5" />
                Plan seç
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status.daysRemaining !== null && status.daysRemaining <= 7) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-foreground">
                Deneme süreniz bitiyor
              </h4>
              <p className="text-sm text-muted-foreground">
                Ücretsiz deneme sürenizin bitmesine{" "}
                <strong className="text-foreground">
                  {status.daysRemaining} gün
                </strong>{" "}
                kaldı.
              </p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href="/ayarlar/abonelik">
                <Sparkles className="h-3.5 w-3.5" />
                Planları gör
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
