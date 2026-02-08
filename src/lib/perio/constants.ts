import type { ToothNumber } from "./types";

/** Upper jaw: right to left (18→11), then left (21→28) */
export const UPPER_JAW_TEETH: ToothNumber[] = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
];

/** Lower jaw: right to left (48→41), then left (31→38) */
export const LOWER_JAW_TEETH: ToothNumber[] = [
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
];

export const ALL_TEETH: ToothNumber[] = [...UPPER_JAW_TEETH, ...LOWER_JAW_TEETH];

/** Multi-rooted teeth that can have furcation involvement */
export const MULTI_ROOTED_TEETH: Set<ToothNumber> = new Set([
  14, 15, 16, 17, 18, 24, 25, 26, 27, 28,
  36, 37, 38, 46, 47, 48,
]);

/** Row labels in Swedish */
export const ROW_LABELS = {
  furcation: "Furk. inv.",
  bleeding: "Blödning",
  plaque: "Plack",
  gingivalMargin: "Marg. gingiva",
  pocketDepth: "Fickdjup",
} as const;

/** Upper jaw row order (furk outermost, fickdjup closest to tongue) */
export const UPPER_ROW_ORDER = [
  "furcation",
  "bleeding",
  "plaque",
  "gingivalMargin",
  "pocketDepth",
] as const;

/** Lower jaw row order (mirrored: fickdjup closest to tongue, furk outermost) */
export const LOWER_ROW_ORDER = [
  "pocketDepth",
  "gingivalMargin",
  "plaque",
  "bleeding",
  "furcation",
] as const;
