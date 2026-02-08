import type { PerioExamination, PerioSummary } from "./types";
import { ALL_TEETH } from "./constants";

export function calculateSummary(exam: PerioExamination): PerioSummary {
  let totalSites = 0;
  let bleedingSites = 0;
  let plaqueSites = 0;

  for (const toothNum of ALL_TEETH) {
    const tooth = exam.teeth[toothNum];
    if (tooth.missing) continue;

    for (const site of ["D", "M"] as const) {
      totalSites++;
      if (tooth.sites[site].bleeding) bleedingSites++;
      if (tooth.sites[site].plaque) plaqueSites++;
    }
  }

  return {
    bvsPercent: totalSites > 0 ? Math.round((bleedingSites / totalSites) * 1000) / 10 : 0,
    pliPercent: totalSites > 0 ? Math.round((plaqueSites / totalSites) * 1000) / 10 : 0,
    totalSites,
    bleedingSites,
    plaqueSites,
  };
}
