import type { PerioExamination, PerioSummary, MeasurementSite } from "./types";
import { ALL_TEETH, TOOTH_SITE_CONFIGS } from "./constants";

export function calculateSummary(exam: PerioExamination): PerioSummary {
  let totalSites = 0;
  let bleedingSites = 0;
  let plaqueSites = 0;

  for (const toothNum of ALL_TEETH) {
    const tooth = exam.teeth[toothNum];
    if (tooth.missing) continue;

    const sites = TOOTH_SITE_CONFIGS[toothNum].general;
    for (const site of sites) {
      const m = tooth.sites[site];
      if (!m) continue;
      totalSites++;
      if (m.bleeding) bleedingSites++;
      if (m.plaque) plaqueSites++;
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
