import { prisma } from "@/lib/prisma";

export type PlanType = "free" | "starter" | "pro" | "enterprise";

export interface PlanLimits {
  maxVehicles: number;
  maxUsers: number;
  maxProjects: number;
  hasReports: boolean;
  hasNotifications: boolean;
  hasSupplierPortal: boolean;
  hasEmailNotifications: boolean;
}

export const PLAN_DEFINITIONS: Record<PlanType, { name: string; limits: PlanLimits; monthlyPrice: number }> = {
  free: {
    name: "Ücretsiz Deneme",
    limits: {
      maxVehicles: 5,
      maxUsers: 3,
      maxProjects: 2,
      hasReports: true,
      hasNotifications: true,
      hasSupplierPortal: false,
      hasEmailNotifications: false,
    },
    monthlyPrice: 0,
  },
  starter: {
    name: "Başlangıç",
    limits: {
      maxVehicles: 20,
      maxUsers: 10,
      maxProjects: 10,
      hasReports: true,
      hasNotifications: true,
      hasSupplierPortal: true,
      hasEmailNotifications: true,
    },
    monthlyPrice: 499,
  },
  pro: {
    name: "Pro",
    limits: {
      maxVehicles: 100,
      maxUsers: 50,
      maxProjects: 50,
      hasReports: true,
      hasNotifications: true,
      hasSupplierPortal: true,
      hasEmailNotifications: true,
    },
    monthlyPrice: 999,
  },
  enterprise: {
    name: "Kurumsal",
    limits: {
      maxVehicles: 9999,
      maxUsers: 9999,
      maxProjects: 9999,
      hasReports: true,
      hasNotifications: true,
      hasSupplierPortal: true,
      hasEmailNotifications: true,
    },
    monthlyPrice: 0, // Özel fiyat
  },
};

/**
 * Organizasyonun aktif olup olmadığını ve deneme süresinin dolup dolmadığını kontrol et
 */
export async function checkOrganizationStatus(organizationId: string): Promise<{
  isActive: boolean;
  isTrialExpired: boolean;
  plan: PlanType;
  daysRemaining: number | null;
  message?: string;
}> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      isActive: true,
      plan: true,
      trialEndsAt: true,
    },
  });

  if (!org) {
    return { isActive: false, isTrialExpired: false, plan: "free", daysRemaining: null, message: "Organizasyon bulunamadı" };
  }

  if (!org.isActive) {
    return { isActive: false, isTrialExpired: false, plan: org.plan as PlanType, daysRemaining: null, message: "Hesabınız devre dışı bırakılmıştır" };
  }

  // Free plan ve deneme süresi kontrolü
  if (org.plan === "free" && org.trialEndsAt) {
    const now = new Date();
    const trialEnd = new Date(org.trialEndsAt);
    const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
      return {
        isActive: true,
        isTrialExpired: true,
        plan: "free",
        daysRemaining: 0,
        message: "Ücretsiz deneme süreniz dolmuştur. Lütfen bir plan seçin.",
      };
    }

    return {
      isActive: true,
      isTrialExpired: false,
      plan: "free",
      daysRemaining,
    };
  }

  return {
    isActive: true,
    isTrialExpired: false,
    plan: org.plan as PlanType,
    daysRemaining: null,
  };
}

/**
 * Organizasyonun bir limiti aşıp aşmadığını kontrol et
 */
export async function checkPlanLimit(
  organizationId: string,
  resource: "vehicles" | "users" | "projects"
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true },
  });

  if (!org) return { allowed: false, current: 0, limit: 0 };

  const plan = PLAN_DEFINITIONS[org.plan as PlanType] || PLAN_DEFINITIONS.free;
  let current = 0;
  let limit = 0;

  switch (resource) {
    case "vehicles":
      current = await prisma.vehicle.count({ where: { organizationId } });
      limit = plan.limits.maxVehicles;
      break;
    case "users":
      current = await prisma.user.count({ where: { organizationId } });
      limit = plan.limits.maxUsers;
      break;
    case "projects":
      current = await prisma.project.count({ where: { organizationId } });
      limit = plan.limits.maxProjects;
      break;
  }

  return { allowed: current < limit, current, limit };
}
