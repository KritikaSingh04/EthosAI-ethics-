import { gaussian, mulberry32 } from "@/lib/rng";

export type BatchPoint = {
  batch: number;
  label: string;
  accuracy: number;
  /** Population Stability Index of the input distribution vs. training. */
  psi: number;
  /** Gap between proxy reward and true mission objective (0 = aligned). */
  misalignment: number;
  /** Rate of protected-object misclassification. */
  protectedErrors: number;
};

/**
 * Evaluation batches for an autonomous target-selection engine.
 * Drift begins at `onset`; `severity` scales how fast performance decays.
 */
export function generateBatches(count = 48, onset = 18, severity = 1): BatchPoint[] {
  const rand = mulberry32(7000);
  const out: BatchPoint[] = [];
  for (let b = 1; b <= count; b++) {
    const t = Math.max(0, b - onset);
    const decay = severity * (1 - Math.exp(-t / 14));
    const psi = Math.max(0.01, 0.04 + decay * 0.34 + gaussian(rand) * 0.012);
    const accuracy = Math.min(0.99, 0.952 - decay * 0.19 + gaussian(rand) * 0.006);
    const misalignment = Math.max(0, 0.05 + decay * 0.42 + gaussian(rand) * 0.015);
    const protectedErrors = Math.max(0, 0.004 + decay * 0.055 + gaussian(rand) * 0.002);
    out.push({ batch: b, label: `B${String(b).padStart(2, "0")}`, accuracy: +accuracy.toFixed(4), psi: +psi.toFixed(3), misalignment: +misalignment.toFixed(3), protectedErrors: +protectedErrors.toFixed(4) });
  }
  return out;
}

export type TargetClass = "Authorized" | "Protected" | "Ambiguous";

export type Decision = {
  id: number;
  at: string;
  candidate: string;
  predicted: TargetClass;
  confidence: number;
  verdict: "executed" | "referred" | "blocked";
  reason: string;
};

export const CANDIDATES = [
  "Vehicle · grid 14C",
  "Structure · grid 09A",
  "Convoy · route R2",
  "Rooftop array · 11F",
  "Field depot · 03B",
  "Bridge span · 07D",
  "Shelter · 12E (flagged)",
  "Comms mast · 05G",
];

export const PSI_ALERT = 0.2;
export const PSI_HALT = 0.25;
