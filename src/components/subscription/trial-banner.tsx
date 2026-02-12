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
    staleTime: 5 * 60 * 1000, // 5 dakika
    refetchOnMount: false,
  });

  if (!status) return null;

  // Enterprise veya ücretli plan - banner gösterme
  if (status.plan !== "free") return null;

  // Deneme süresi dolmuş
  if (status.isTrialExpired) {
    return (
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-700 dark:text-red-400">
              Deneme Süreniz Doldu
            </h4>
            <p className="text-sm text-red-600 dark:text-red-400/80 mt-1">
              {status.message || "Ücretsiz deneme süreniz sona erdi. Hizmetlerimize devam etmek için bir plan seçin."}
            </p>
            <div className="mt-3">
              <Button size="sm" className="bg-red-600 hover:bg-red-700" asChild>
                <Link href="/ayarlar/abonelik">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Plan Seç
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Deneme süresi devam ediyor (7 gün veya daha az kaldıysa göster)
  if (status.daysRemaining !== null && status.daysRemaining <= 7) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-amber-700 dark:text-amber-400">
              Deneme Süreniz Bitiyor
            </h4>
            <p className="text-sm text-amber-600 dark:text-amber-400/80 mt-1">
              Ücretsiz deneme sürenizin bitmesine <strong>{status.daysRemaining} gün</strong> kaldı.
              Kesintisiz hizmet için bir plan seçin.
            </p>
            <div className="mt-3">
              <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100" asChild>
                <Link href="/ayarlar/abonelik">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Planları Gör
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
