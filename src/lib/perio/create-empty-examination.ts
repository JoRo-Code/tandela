import type { PerioExamination, ToothData, ToothNumber, MeasurementSite, SiteMeasurement } from "./types";
import { ALL_TEETH, TOOTH_SITE_CONFIGS } from "./constants";

export function createEmptySite(): SiteMeasurement {
  return {
    furcation: false,
    bleeding: false,
    plaque: false,
    pocketDepth: null,
    gingivalMargin: null,
  };
}

/** Creates empty sites for a tooth based on its general site config */
export function createEmptySites(toothNumber: ToothNumber): Partial<Record<MeasurementSite, SiteMeasurement>> {
  const config = TOOTH_SITE_CONFIGS[toothNumber];
  const sites: Partial<Record<MeasurementSite, SiteMeasurement>> = {};
  for (const site of config.general) {
    sites[site] = createEmptySite();
  }
  return sites;
}

function createEmptyTooth(toothNumber: ToothNumber): ToothData {
  return {
    toothNumber,
    missing: false,
    sites: createEmptySites(toothNumber),
    comment: "",
  };
}

export function createEmptyExamination(): PerioExamination {
  const teeth = {} as Record<ToothNumber, ToothData>;
  for (const num of ALL_TEETH) {
    teeth[num] = createEmptyTooth(num);
  }
  return { teeth };
}
