export type AutonomyLevel = "advisory" | "human-in-the-loop" | "human-on-the-loop" | "fully-autonomous";

export const AUTONOMY: { value: AutonomyLevel; label: string; multiplier: number }[] = [
  { value: "advisory", label: "Advisory only — human decides", multiplier: 0.8 },
  { value: "human-in-the-loop", label: "Human-in-the-loop — human approves each decision", multiplier: 1 },
  { value: "human-on-the-loop", label: "Human-on-the-loop — human can intervene", multiplier: 1.2 },
  { value: "fully-autonomous", label: "Fully autonomous", multiplier: 1.5 },
];

export type ImpactCategory = {
  key: "dignity" | "environment" | "labor" | "governance";
  label: string;
  unesco: string;
  prompts: string[];
};

export const IMPACT_CATEGORIES: ImpactCategory[] = [
  {
    key: "dignity",
    label: "Human rights & dignity",
    unesco: "Values: Respect, protection and promotion of human rights, fundamental freedoms and human dignity",
    prompts: ["Could the system demean, manipulate or dehumanise people?", "Are vulnerable groups (children, elderly, disabled) affected?", "Is there a right to a human decision?"],
  },
  {
    key: "environment",
    label: "Environment & ecosystem flourishing",
    unesco: "Policy Area 5: Environment and ecosystems",
    prompts: ["Estimated training + inference energy (kWh / year)?", "Water use and hardware lifecycle accounted for?", "Is a smaller model sufficient for the task?"],
  },
  {
    key: "labor",
    label: "Labour & economy",
    unesco: "Policy Area 10: Economy and labour",
    prompts: ["Which roles are automated, augmented or deskilled?", "Is there a reskilling / transition plan?", "Are data-labelling workers fairly paid?"],
  },
  {
    key: "governance",
    label: "Governance & democratic process",
    unesco: "Policy Area 4: Data policy · Policy Area 2: Ethical governance and stewardship",
    prompts: ["Who is accountable for harms and redress?", "Is the system auditable by an independent party?", "Could it affect public discourse or elections?"],
  },
];

/** IEEE 7000 value-based engineering: elicited values → ethical value requirements (EVRs). */
export const IEEE_VALUES: { value: string; evr: string }[] = [
  { value: "Autonomy", evr: "Users can opt out of automated processing and request human review within 72 h." },
  { value: "Fairness", evr: "Selection-rate ratio across protected groups ≥ 0.8, monitored monthly." },
  { value: "Privacy", evr: "Personal data retained ≤ 180 days; purpose-bound access logged." },
  { value: "Transparency", evr: "Each decision ships a plain-language reason code and model version." },
  { value: "Safety", evr: "Fail-safe default to 'refer to human' on confidence < 0.7 or drift alarm." },
  { value: "Accountability", evr: "Named system owner; immutable decision log kept for 3 years." },
  { value: "Sustainability", evr: "Energy per 1k inferences reported; carbon-aware scheduling for retraining." },
];

export const SEVERITY_LABELS = ["Negligible", "Minor", "Moderate", "Major", "Severe"] as const;

export function aiaTier(score: number) {
  if (score >= 70) return { tier: "Level IV — Very high impact", tone: "critical" as const };
  if (score >= 50) return { tier: "Level III — High impact", tone: "serious" as const };
  if (score >= 30) return { tier: "Level II — Moderate impact", tone: "warning" as const };
  return { tier: "Level I — Little to no impact", tone: "good" as const };
}
