import { gaussian, mulberry32 } from "@/lib/rng";

export type Scored = { group: "Group A" | "Group B"; label: 0 | 1; score: number };

/** Loan-default-style classifier outputs where Group B's scores are shifted down. */
export function generatePredictions(n = 4000): Scored[] {
  const rand = mulberry32(99);
  const out: Scored[] = [];
  for (let i = 0; i < n; i++) {
    const group = rand() < 0.62 ? "Group A" : "Group B";
    const base = group === "Group A" ? 0.46 : 0.38;
    const label = rand() < base ? 1 : 0;
    const shift = group === "Group B" ? -0.09 : 0;
    const mu = (label ? 0.66 : 0.36) + shift;
    const score = Math.min(0.999, Math.max(0.001, mu + gaussian(rand) * 0.15));
    out.push({ group, label: label as 0 | 1, score });
  }
  return out;
}

export type GroupMetrics = {
  group: string;
  n: number;
  selectionRate: number;
  tpr: number;
  fpr: number;
  precision: number;
  accuracy: number;
};

export function groupMetrics(data: Scored[], thresholds: Record<string, number>): GroupMetrics[] {
  const groups = ["Group A", "Group B"] as const;
  return groups.map((g) => {
    const rows = data.filter((d) => d.group === g);
    let tp = 0, fp = 0, tn = 0, fn = 0;
    for (const r of rows) {
      const pred = r.score >= thresholds[g] ? 1 : 0;
      if (pred && r.label) tp++;
      else if (pred && !r.label) fp++;
      else if (!pred && r.label) fn++;
      else tn++;
    }
    return {
      group: g,
      n: rows.length,
      selectionRate: (tp + fp) / rows.length,
      tpr: tp / (tp + fn || 1),
      fpr: fp / (fp + tn || 1),
      precision: tp / (tp + fp || 1),
      accuracy: (tp + tn) / rows.length,
    };
  });
}

/** Simple logistic model used for the explainability pane. */
export type Feature = {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  mean: number;
  /** Logit weight per unit. */
  weight: number;
  actionable: boolean;
};

export const FEATURES: Feature[] = [
  { key: "income", label: "Annual income", unit: "₹ lakh", min: 2, max: 40, step: 0.5, mean: 9.5, weight: 0.11, actionable: true },
  { key: "dti", label: "Debt-to-income", unit: "%", min: 0, max: 80, step: 1, mean: 32, weight: -0.045, actionable: true },
  { key: "history", label: "Credit history length", unit: "yrs", min: 0, max: 25, step: 1, mean: 6, weight: 0.08, actionable: false },
  { key: "late", label: "Late payments (24 mo)", unit: "count", min: 0, max: 12, step: 1, mean: 1.2, weight: -0.38, actionable: true },
  { key: "util", label: "Credit utilisation", unit: "%", min: 0, max: 100, step: 1, mean: 41, weight: -0.018, actionable: true },
  { key: "tenure", label: "Employment tenure", unit: "yrs", min: 0, max: 30, step: 1, mean: 4.5, weight: 0.06, actionable: false },
];

export const INTERCEPT = 0.25;
export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export const baseLogit = INTERCEPT;
export function logit(x: Record<string, number>) {
  return FEATURES.reduce((z, f) => z + f.weight * (x[f.key] - f.mean), INTERCEPT);
}

export type Applicant = { id: string; name: string; values: Record<string, number> };

export const APPLICANTS: Applicant[] = [
  { id: "A-1042", name: "Applicant A-1042", values: { income: 6.5, dti: 48, history: 3, late: 3, util: 72, tenure: 2 } },
  { id: "A-2210", name: "Applicant A-2210", values: { income: 14, dti: 22, history: 9, late: 0, util: 28, tenure: 7 } },
  { id: "B-0387", name: "Applicant B-0387", values: { income: 8, dti: 38, history: 2, late: 1, util: 55, tenure: 1 } },
  { id: "B-1123", name: "Applicant B-1123", values: { income: 4.5, dti: 61, history: 5, late: 5, util: 88, tenure: 3 } },
];
