export const VEHICLE_TYPES = [
  "CAR", "SUV", "MOTORCYCLE", "PICKUP", "VAN", "TRUCK", "OTHER",
] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const POWERTRAIN_TYPES = [
  "PETROL", "DIESEL", "LPG", "CNG", "HYBRID", "PHEV", "BEV", "HYDROGEN", "OTHER", "UNKNOWN",
] as const;
export type PowertrainType = (typeof POWERTRAIN_TYPES)[number];

export const TRANSMISSION_TYPES = ["MANUAL", "AUTOMATIC", "CVT", "DCT", "OTHER", "UNKNOWN"] as const;
export type TransmissionType = (typeof TRANSMISSION_TYPES)[number];

export const ODOMETER_UNITS = ["KM", "MI"] as const;
export type OdometerUnit = (typeof ODOMETER_UNITS)[number];

export const VOLUME_UNITS = ["L", "GAL_US"] as const;
export type VolumeUnit = (typeof VOLUME_UNITS)[number];

export const CURRENCIES = ["USD", "EUR", "ARS", "GBP", "BRL", "CLP", "MXN", "UYU"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const THEMES = ["LIGHT", "DARK", "SYSTEM"] as const;
export type Theme = (typeof THEMES)[number];

export const DISTANCE_UNITS = ["KM", "MI"] as const;
export type DistanceUnit = (typeof DISTANCE_UNITS)[number];

export const MAINTENANCE_CATEGORIES = [
  "ENGINE_OIL", "OIL_FILTER", "AIR_FILTER", "CABIN_FILTER", "FUEL_FILTER",
  "BRAKES", "TIRES", "BATTERY", "COOLING", "FLUIDS", "TRANSMISSION",
  "SUSPENSION", "STEERING", "ELECTRICAL", "INSPECTION", "GENERAL_SERVICE",
  "REPAIR", "OTHER",
] as const;
export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number];

export const EXPENSE_CATEGORIES = [
  "FUEL", "CHARGING", "MAINTENANCE", "REPAIRS", "INSURANCE", "TAXES_REGISTRATION",
  "INSPECTIONS", "PARKING", "TOLLS", "CLEANING", "ACCESSORIES", "FINANCING",
  "FINES", "OTHER",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const DOCUMENT_CATEGORIES = [
  "INSURANCE", "REGISTRATION", "INSPECTION", "OWNERSHIP", "INVOICE", "SERVICE_RECEIPT",
  "WARRANTY", "MANUAL", "OTHER",
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const REMINDER_CATEGORIES = [
  "MAINTENANCE", "INSURANCE", "REGISTRATION", "INSPECTION", "TAXES", "TIRES",
  "BATTERY", "DOCUMENT", "CUSTOM",
] as const;
export type ReminderCategory = (typeof REMINDER_CATEGORIES)[number];

export const ENERGY_EVENT_TYPES = ["FUEL_FILLUP", "CHARGING_SESSION"] as const;
export type EnergyEventType = (typeof ENERGY_EVENT_TYPES)[number];

export const FUEL_TYPES = ["PETROL", "DIESEL", "LPG", "CNG", "E85", "OTHER"] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const CHARGING_TYPES = ["HOME", "PUBLIC", "FAST", "OTHER"] as const;
export type ChargingType = (typeof CHARGING_TYPES)[number];

export const PAYMENT_METHODS = ["CASH", "CARD", "TRANSFER", "OTHER"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type ApiSuccess<T> = { data: T };
export type ApiError = { error: { code: string; message: string; details?: unknown } };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
