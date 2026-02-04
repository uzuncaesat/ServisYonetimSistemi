import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function generateReportNumber(year: number, sequence: number): string {
  return `RAP-${year}-${String(sequence).padStart(3, "0")}`;
}

// Puantaj hesaplama fonksiyonları
export function calculateTimesheetTotals(entries: Array<{ seferSayisi: number; birimFiyatSnapshot: number; kdvOraniSnapshot: number }>) {
  const toplam = entries.reduce((sum, e) => sum + e.seferSayisi * e.birimFiyatSnapshot, 0);
  const kdvOrani = entries[0]?.kdvOraniSnapshot ?? 20;
  const kdv = toplam * (kdvOrani / 100);
  const araToplam = toplam + kdv;
  const tevkifat = kdv * 0.5; // 5/10 tevkifat
  const faturaTutari = araToplam - tevkifat;

  return {
    toplam,
    kdv,
    araToplam,
    tevkifat,
    faturaTutari,
  };
}
