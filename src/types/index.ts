// Document types
export type OwnerType = "VEHICLE" | "DRIVER";

export type VehicleDocType = "RUHSAT" | "SIGORTA" | "MUAYENE" | "KASKO" | "DIGER";
export type DriverDocType = "EHLIYET" | "SRC" | "PSIKOTEKNIK" | "ADLI_SICIL" | "IKAMETGAH" | "DIGER";
export type DocType = VehicleDocType | DriverDocType;

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Timesheet calculation result
export interface TimesheetCalculation {
  toplam: number;
  kdv: number;
  araToplam: number;
  tevkifat: number;
  faturaTutari: number;
}
