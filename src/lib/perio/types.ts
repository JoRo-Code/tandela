/** FDI tooth numbering (ISO 3950) */
export type ToothNumber =
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18
  | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28
  | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38
  | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48;

/** D = Distal, M = Mesial */
export type MeasurementSite = "D" | "M";

export interface SiteMeasurement {
  furcation: boolean;
  bleeding: boolean;
  plaque: boolean;
  pocketDepth: number | null;
  gingivalMargin: number | null;
}

export interface ToothData {
  toothNumber: ToothNumber;
  missing: boolean;
  sites: Record<MeasurementSite, SiteMeasurement>;
  comment: string;
}

export interface PerioExamination {
  teeth: Record<ToothNumber, ToothData>;
}

export interface PerioSummary {
  bvsPercent: number;
  pliPercent: number;
  bleedingSites: number;
  plaqueSites: number;
  totalSites: number;
}

export type CheckboxField = "furcation" | "bleeding" | "plaque";
export type NumericField = "pocketDepth" | "gingivalMargin";

export type PerioAction =
  | { type: "SET_CHECKBOX"; tooth: ToothNumber; site: MeasurementSite; field: CheckboxField; value: boolean }
  | { type: "SET_NUMERIC"; tooth: ToothNumber; site: MeasurementSite; field: NumericField; value: number | null }
  | { type: "TOGGLE_MISSING"; tooth: ToothNumber }
  | { type: "SET_COMMENT"; tooth: ToothNumber; comment: string }
  | { type: "CLEAR_ALL" };
