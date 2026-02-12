"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { Check, Sparkles, Zap, Building2, Crown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface OrgStatus {
  isActive: boolean;
  isTrialExpired: boolean;
  plan: string;
  daysRemaining: number | null;
  planDetails: {
    name: string;
    monthlyPrice: number;
    limits: {
      maxVehicles: number;
      maxUsers: number;
      maxProjects: number;
      hasReports: boolean;
      hasNotifications: boolean;
      hasSupplierPortal: boolean;
      hasEmailNotifications: boolean;
    };
  };
}

const plans = [
  {
    id: "free",
    name: "Ücretsiz Deneme",
    price: 0,
    description: "14 gün ücretsiz deneyin",
    icon: Sparkles,
    color: "border-slate-200 dark:border-slate-700",
    features: ["5 araç", "3 kullanıcı", "2 proje", "Raporlar", "Bildirimler"],
    notIncluded: ["Tedarikçi portalı", "E-posta bildirimleri"],
  },
  {
    id: "starter",
    name: "Başlangıç",
    price: 499,
    description: "Küçük filolar için ideal",
    icon: Zap,
    color: "border-blue-500",
    popular: true,
    features: ["20 araç", "10 kullanıcı", "10 proje", "Raporlar", "Bildirimler", "Tedarikçi portalı", "E-posta bildirimleri"],
    notIncluded: [],
  },
  {
    id: "pro",
    name: "Pro",
    price: 999,
    description: "Büyüyen işletmeler için",
    icon: Building2,
    color: "border-purple-500",
    features: ["100 araç", "50 kullanıcı", "50 proje", "Raporlar", "Bildirimler", "Tedarikçi portalı", "E-posta bildirimleri", "Öncelikli destek"],
    notIncluded: [],
  },
  {
    id: "enterprise",
    name: "Kurumsal",
    price: -1, // Özel fiyat
    description: "Büyük filolar için özel çözüm",
    icon: Crown,
    color: "border-amber-500",
    features: ["Sınırsız araç", "Sınırsız kullanıcı", "Sınırsız proje", "Tüm özellikler", "Özel entegrasyonlar", "SLA garantisi", "Özel destek"],
    notIncluded: [],
  },
];

async function fetchOrgStatus(): Promise<OrgStatus> {
  const res = await fetch("/api/organizations/status", { cache: "no-store" });
  if (!res.ok) throw new Error("Durum alınamadı");
  return res.json();
}

export default function SubscriptionPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const isAdmin = session?.user?.role === "ADMIN";

  const { data: status, isLoading } = useQuery({
    queryKey: ["org-status"],
    queryFn: fetchOrgStatus,
  });

  const upgradeMutation = useMutation({
    mutationFn: async (plan: string) => {
      // Stripe checkout denemesi
      const checkoutRes = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok) {
        throw new Error(checkoutData.error);
      }

      // Stripe URL varsa yönlendir, yoksa doğrudan güncelleme yapıldı
      if (checkoutData.url) {
        window.location.href = checkoutData.url;
        return checkoutData;
      }

      // Direct mode (Stripe yoksa)
      return checkoutData;
    },
    onSuccess: (data) => {
      if (!data?.url) {
        // Doğrudan güncelleme yapıldı (Stripe yoksa)
        queryClient.invalidateQueries({ queryKey: ["org-status"] });
        toast({ title: "Plan güncellendi" });
      }
      // Stripe varsa sayfa yönlendirilecek
    },
    onError: (error: Error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const currentPlan = status?.plan || "free";

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Abonelik Yönetimi"
        description="Planınızı yönetin ve yükseltin"
      />

      {/* Current Plan Info */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Mevcut Plan</p>
              <h3 className="text-xl font-bold mt-1">
                {status?.planDetails?.name || "Ücretsiz Deneme"}
              </h3>
              {status?.daysRemaining !== null && status?.daysRemaining !== undefined && (
                <p className="text-sm text-amber-600 mt-1">
                  Deneme süresinin bitmesine {status.daysRemaining} gün kaldı
                </p>
              )}
            </div>
            {status?.planDetails?.monthlyPrice ? (
              <div className="text-right">
                <p className="text-3xl font-bold">{status.planDetails.monthlyPrice} TL</p>
                <p className="text-sm text-muted-foreground">/ay</p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          const isPopular = plan.popular;

          return (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all hover:shadow-lg ${plan.color} ${
                isCurrent ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {isPopular && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Popüler
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-3">
                  {plan.price === 0 ? (
                    <span className="text-2xl font-bold">Ücretsiz</span>
                  ) : plan.price === -1 ? (
                    <span className="text-2xl font-bold">Özel Fiyat</span>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground"> TL/ay</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-6">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground line-through">
                      <span className="w-4 h-4 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <Badge className="w-full justify-center py-2">Mevcut Plan</Badge>
                ) : plan.id === "enterprise" ? (
                  <Button variant="outline" className="w-full" disabled>
                    İletişime Geçin
                  </Button>
                ) : isAdmin ? (
                  <Button
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => upgradeMutation.mutate(plan.id)}
                    disabled={upgradeMutation.isPending}
                  >
                    {upgradeMutation.isPending ? "İşleniyor..." : "Bu Plana Geç"}
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Sadece Admin
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Note */}
      <Card className="border-0 shadow-sm bg-muted/30">
        <CardContent className="p-4 text-sm text-muted-foreground">
          <p>
            <strong>Not:</strong> Plan değişiklikleri anında uygulanır. Ödeme entegrasyonu yakında
            eklenecektir. Şu anda plan değişiklikleri yönetici tarafından manuel olarak yapılmaktadır.
            Kurumsal plan için lütfen bizimle iletişime geçin.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
