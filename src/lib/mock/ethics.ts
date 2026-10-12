import type { RiskLevel } from "@/components/ui/badge";

export type DimensionKey =
  | "transparency"
  | "privacy"
  | "fairness"
  | "accountability"
  | "safety"
  | "oversight"
  | "sustainability"
  | "contestability";

export type Dimension = {
  key: DimensionKey;
  label: string;
  /** Short pillar label for the radar axis. */
  pillar: string;
  unesco: string;
  ieee: string;
  weight: number;
  question: string;
};

export const DIMENSIONS: Dimension[] = [
  { key: "transparency", label: "Transparency & Explainability", pillar: "Transparency", unesco: "Transparency and explainability", ieee: "IEEE 7001 – Transparency of autonomous systems", weight: 1.2, question: "Can affected users obtain a meaningful explanation of individual outcomes?" },
  { key: "privacy", label: "Privacy & Data Protection", pillar: "Privacy", unesco: "Right to privacy and data protection", ieee: "IEEE 7002 – Data privacy process", weight: 1.2, question: "Is personal data minimised, consented, and protected across its lifecycle?" },
  { key: "fairness", label: "Fairness & Non-discrimination", pillar: "Fairness", unesco: "Fairness and non-discrimination", ieee: "IEEE 7003 – Algorithmic bias considerations", weight: 1.3, question: "Are outcomes tested for disparate impact across protected groups?" },
  { key: "accountability", label: "Responsibility & Accountability", pillar: "Accountability", unesco: "Responsibility and accountability", ieee: "IEEE 7000 – Value-based engineering (ownership)", weight: 1.1, question: "Is there a named owner, an audit trail, and a redress channel?" },
  { key: "safety", label: "Safety & Security", pillar: "Safety", unesco: "Safety and security", ieee: "IEEE 7009 – Fail-safe design", weight: 1.0, question: "Are failure modes, adversarial inputs and fallbacks tested?" },
  { key: "oversight", label: "Human Oversight & Determination", pillar: "Oversight", unesco: "Human oversight and determination", ieee: "IEEE 7000 – Stakeholder value elicitation", weight: 1.0, question: "Can a qualified human intervene or override high-stakes decisions?" },
  { key: "sustainability", label: "Sustainability", pillar: "Sustainability", unesco: "Environment and ecosystem flourishing", ieee: "IEEE 7010 – Well-being impact assessment", weight: 0.6, question: "Is the compute/energy footprint measured and proportionate?" },
  { key: "contestability", label: "Awareness & Contestability", pillar: "Contestability", unesco: "Awareness and literacy", ieee: "IEEE 7010 – Well-being metrics", weight: 0.8, question: "Are users informed an AI is involved and able to contest it?" },
];

export type AppProfile = {
  id: string;
  name: string;
  sector: string;
  description: string;
  /** Control maturity 0–100 per dimension (higher = better controls). */
  scores: Record<DimensionKey, number>;
  /** Inherent impact 1–5 if the dimension fails in this context. */
  impact: Record<DimensionKey, number>;
};

export const APPLICATIONS: AppProfile[] = [
  {
    id: "hirerank",
    name: "HireRank resume screener",
    sector: "Employment",
    description: "Ranks inbound applicants for recruiter shortlists using a gradient-boosted model on CV text features.",
    scores: { transparency: 38, privacy: 62, fairness: 31, accountability: 55, safety: 70, oversight: 48, sustainability: 74, contestability: 29 },
    impact: { transparency: 4, privacy: 3, fairness: 5, accountability: 4, safety: 2, oversight: 4, sustainability: 1, contestability: 4 },
  },
  {
    id: "faceid-transit",
    name: "Transit FaceID gates",
    sector: "Public sector",
    description: "Real-time face matching at metro gates against a commuter enrollment gallery.",
    scores: { transparency: 44, privacy: 22, fairness: 41, accountability: 50, safety: 58, oversight: 35, sustainability: 52, contestability: 33 },
    impact: { transparency: 3, privacy: 5, fairness: 5, accountability: 4, safety: 4, oversight: 5, sustainability: 2, contestability: 4 },
  },
  {
    id: "credit-score",
    name: "MicroLend credit scorer",
    sector: "Financial services",
    description: "Scores thin-file borrowers using alternative data (mobile usage, utility payments).",
    scores: { transparency: 57, privacy: 46, fairness: 52, accountability: 71, safety: 76, oversight: 66, sustainability: 80, contestability: 60 },
    impact: { transparency: 4, privacy: 4, fairness: 5, accountability: 3, safety: 2, oversight: 3, sustainability: 1, contestability: 4 },
  },
  {
    id: "triage-bot",
    name: "Mental-health triage chatbot",
    sector: "Healthcare",
    description: "LLM-based assistant that triages user messages and escalates crisis signals to counsellors.",
    scores: { transparency: 64, privacy: 58, fairness: 69, accountability: 61, safety: 43, oversight: 72, sustainability: 39, contestability: 70 },
    impact: { transparency: 3, privacy: 5, fairness: 3, accountability: 4, safety: 5, oversight: 5, sustainability: 2, contestability: 3 },
  },
  {
    id: "crop-advisor",
    name: "Crop yield advisor",
    sector: "Agriculture",
    description: "Satellite + weather model recommending sowing windows to smallholder farmers.",
    scores: { transparency: 78, privacy: 84, fairness: 72, accountability: 80, safety: 82, oversight: 77, sustainability: 61, contestability: 75 },
    impact: { transparency: 2, privacy: 2, fairness: 3, accountability: 2, safety: 3, oversight: 2, sustainability: 3, contestability: 2 },
  },
];

export function riskForScore(score: number): RiskLevel {
  if (score < 35) return "critical";
  if (score < 55) return "high";
  if (score < 75) return "medium";
  return "low";
}

/** Likelihood 1–5 that a control gap materialises, from control maturity. */
export const likelihood = (score: number) => Math.min(5, Math.max(1, Math.ceil((100 - score) / 20)));

export function complianceScore(scores: Record<DimensionKey, number>) {
  const total = DIMENSIONS.reduce((s, d) => s + d.weight, 0);
  return DIMENSIONS.reduce((s, d) => s + scores[d.key] * d.weight, 0) / total;
}

/** Minimum acceptable maturity per pillar (organisational baseline). */
export const BASELINE = 65;
