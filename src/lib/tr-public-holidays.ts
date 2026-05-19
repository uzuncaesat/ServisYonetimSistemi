import Holidays from "date-holidays";
import type { HolidaysTypes } from "date-holidays";

let hdInstance: Holidays | null = null;

function getHolidaysInstance(): Holidays {
  if (!hdInstance) {
    hdInstance = new Holidays("TR");
    hdInstance.setLanguages("tr");
  }
  return hdInstance;
}

function toLocalDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

function getPublicHolidaysForDate(
  year: number,
  month: number,
  day: number
): HolidaysTypes.Holiday[] {
  const result = getHolidaysInstance().isHoliday(toLocalDate(year, month, day));
  if (!result) return [];
  const holidays = Array.isArray(result) ? result : [result];
  return holidays.filter((h) => h.type === "public");
}

export function isTurkishPublicHoliday(
  year: number,
  month: number,
  day: number
): boolean {
  return getPublicHolidaysForDate(year, month, day).length > 0;
}

export function getTurkishPublicHolidayName(
  year: number,
  month: number,
  day: number
): string | null {
  const publicHolidays = getPublicHolidaysForDate(year, month, day);
  return publicHolidays[0]?.name ?? null;
}
