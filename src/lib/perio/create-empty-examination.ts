import type { PerioExamination, ToothData, ToothNumber, SiteMeasurement } from "./types";
import { ALL_TEETH } from "./constants";

function createEmptySite(): SiteMeasurement {
  return {
    furcation: false,
    bleeding: false,
    plaque: false,
    pocketDepth: null,
    gingivalMargin: null,
  };
}

function createEmptyTooth(toothNumber: ToothNumber): ToothData {
  return {
    toothNumber,
    missing: false,
    sites: { D: createEmptySite(), M: createEmptySite() },
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
