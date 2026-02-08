import type { ToothNumber, MeasurementSite } from "./types";

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

// ── Per-tooth site configuration ──

interface ToothSiteConfig {
  /** Sites for general measurements (bleeding, plaque, pocket depth, gingival margin) */
  general: MeasurementSite[];
  /** Sites for furcation involvement (empty = no furcation possible) */
  furcation: MeasurementSite[];
}

function buildSiteConfigs(): Record<ToothNumber, ToothSiteConfig> {
  const configs = {} as Record<ToothNumber, ToothSiteConfig>;

  for (const t of ALL_TEETH) {
    const quadrant = Math.floor(t / 10); // 1, 2, 3, 4
    const position = t % 10; // 1-8
    const isMolar = position >= 6;
    const isPremolar = position === 4 || position === 5;

    let general: MeasurementSite[];
    let furcation: MeasurementSite[];

    switch (quadrant) {
      case 1: // Upper right (18→11): DBPM
        general = ["D", "B", "P", "M"];
        furcation = isMolar ? ["D", "B", "M"] : isPremolar ? ["D", "M"] : [];
        break;
      case 2: // Upper left (21→28): BDMP
        general = ["B", "D", "M", "P"];
        furcation = isMolar ? ["M", "B", "D"] : isPremolar ? ["M", "D"] : [];
        break;
      case 4: // Lower right (48→41): LMDB
        general = ["L", "M", "D", "B"];
        furcation = isMolar ? ["B", "L"] : [];
        break;
      case 3: // Lower left (31→38): MLBD
        general = ["M", "L", "B", "D"];
        furcation = isMolar ? ["L", "B"] : [];
        break;
      default:
        general = ["D", "B", "P", "M"];
        furcation = [];
    }

    configs[t] = { general, furcation };
  }

  return configs;
}

export const TOOTH_SITE_CONFIGS = buildSiteConfigs();

/** Max number of general sites across all teeth (for column width) */
export const MAX_GENERAL_SITES = 4;
