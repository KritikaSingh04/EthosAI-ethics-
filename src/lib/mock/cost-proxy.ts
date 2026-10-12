import { gaussian, mulberry32 } from "@/lib/rng";

export type Patient = {
  race: "Black" | "White";
  /** Active chronic conditions — the "true need" signal. */
  chronic: number;
  /** Annual cost in $ — the proxy label. */
  cost: number;
};

/**
 * Synthetic cohort reproducing the mechanism in Obermeyer et al. (Science, 2019):
 * at equal illness, Black patients generate less cost because of unequal access
 * to care, so a model trained to predict cost under-ranks them.
 */
export function generateCohort(n = 6000, accessGap = 0.3): Patient[] {
  const rand = mulberry32(2019);
  const out: Patient[] = [];
  for (let i = 0; i < n; i++) {
    const race = rand() < 0.12 ? "Black" : "White";
    // Black patients carry slightly higher illness burden on average.
    const lambda = race === "Black" ? 2.2 : 1.8;
    const chronic = Math.max(0, Math.round(lambda + gaussian(rand) * 1.6 + (rand() < 0.08 ? 4 : 0)));
    const access = race === "Black" ? 1 - accessGap : 1;
    const cost = Math.max(200, Math.round((1500 + chronic * 2600) * access * Math.exp(gaussian(rand) * 0.35)));
    out.push({ race, chronic, cost });
  }
  return out;
}

/**
 * Risk score blends normalised cost and normalised need.
 * alpha = 0 → pure cost target (status quo), alpha = 1 → pure health-need target.
 */
export function riskScores(cohort: Patient[], alpha: number) {
  const maxCost = Math.max(...cohort.map((p) => p.cost));
  const maxChronic = Math.max(...cohort.map((p) => p.chronic)) || 1;
  return cohort.map((p) => (1 - alpha) * (p.cost / maxCost) + alpha * (p.chronic / maxChronic) + 1e-6 * p.chronic);
}

export type CurvePoint = { percentile: number; Black: number | null; White: number | null };

/** Mean chronic conditions by risk-score percentile (Obermeyer Fig. 1A). */
export function disparityCurve(cohort: Patient[], scores: number[], bins = 20): CurvePoint[] {
  const order = scores.map((s, i) => [s, i] as const).sort((a, b) => a[0] - b[0]);
  const size = Math.ceil(order.length / bins);
  const points: CurvePoint[] = [];
  for (let b = 0; b < bins; b++) {
    const slice = order.slice(b * size, (b + 1) * size).map(([, i]) => cohort[i]);
    const mean = (race: Patient["race"]) => {
      const g = slice.filter((p) => p.race === race);
      return g.length >= 3 ? +(g.reduce((s, p) => s + p.chronic, 0) / g.length).toFixed(2) : null;
    };
    points.push({ percentile: Math.round(((b + 1) / bins) * 100), Black: mean("Black"), White: mean("White") });
  }
  return points;
}

export type Allocation = {
  enrolled: number;
  blackShare: number;
  meanChronic: { Black: number; White: number };
  missedHighNeed: number;
};

/** Patients at or above the percentile cut are auto-enrolled in care management. */
export function allocate(cohort: Patient[], scores: number[], percentile: number): Allocation {
  const sorted = [...scores].sort((a, b) => a - b);
  const cut = sorted[Math.min(sorted.length - 1, Math.floor((percentile / 100) * sorted.length))];
  const enrolledSet = new Set<Patient>();
  cohort.forEach((p, i) => scores[i] >= cut && enrolledSet.add(p));
  const enrolled = [...enrolledSet];
  const by = (r: Patient["race"]) => enrolled.filter((p) => p.race === r);
  const avg = (ps: Patient[]) => (ps.length ? ps.reduce((s, p) => s + p.chronic, 0) / ps.length : 0);
  const highNeed = cohort.filter((p) => p.chronic >= 5);
  const missed = highNeed.filter((p) => !enrolledSet.has(p)).length;
  return {
    enrolled: enrolled.length,
    blackShare: enrolled.length ? by("Black").length / enrolled.length : 0,
    meanChronic: { Black: avg(by("Black")), White: avg(by("White")) },
    missedHighNeed: highNeed.length ? missed / highNeed.length : 0,
  };
}
