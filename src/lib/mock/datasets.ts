import { mulberry32 } from "@/lib/rng";

export type Row = Record<string, string | number>;

export type SampleDataset = {
  id: string;
  name: string;
  description: string;
  target: string;
  positive: string;
  protectedAttrs: string[];
  rows: Row[];
};

function pick<T>(rand: () => number, items: [T, number][]): T {
  const r = rand();
  let acc = 0;
  for (const [v, p] of items) {
    acc += p;
    if (r < acc) return v;
  }
  return items[items.length - 1][0];
}

function creditLending(n = 2400): Row[] {
  const rand = mulberry32(42);
  const rows: Row[] = [];
  for (let i = 0; i < n; i++) {
    const gender = pick(rand, [["Male", 0.64], ["Female", 0.33], ["Non-binary", 0.03]]);
    const age = pick(rand, [["18–25", 0.14], ["26–40", 0.43], ["41–60", 0.33], ["60+", 0.1]]);
    const region = pick(rand, [["Urban", 0.71], ["Semi-urban", 0.21], ["Rural", 0.08]]);
    const income = Math.round(25000 + rand() * 90000 + (gender === "Male" ? 9000 : 0) + (region === "Urban" ? 12000 : 0));
    let p = 0.18 + (income - 25000) / 160000;
    if (gender === "Female") p -= 0.11;
    if (gender === "Non-binary") p -= 0.14;
    if (age === "18–25") p -= 0.12;
    if (age === "60+") p -= 0.08;
    if (region === "Rural") p -= 0.15;
    rows.push({ applicant_id: `CL-${10000 + i}`, gender, age_band: age, region, monthly_income: income, approved: rand() < p ? "yes" : "no" });
  }
  return rows;
}

function hiring(n = 1800): Row[] {
  const rand = mulberry32(7);
  const rows: Row[] = [];
  for (let i = 0; i < n; i++) {
    const gender = pick(rand, [["Male", 0.71], ["Female", 0.27], ["Non-binary", 0.02]]);
    const ethnicity = pick(rand, [["Group A", 0.58], ["Group B", 0.24], ["Group C", 0.13], ["Group D", 0.05]]);
    const disability = pick(rand, [["No", 0.95], ["Yes", 0.05]]);
    const years = Math.round(rand() * 14);
    let p = 0.12 + years * 0.018;
    if (gender === "Female") p -= 0.07;
    if (ethnicity === "Group C") p -= 0.06;
    if (ethnicity === "Group D") p -= 0.09;
    if (disability === "Yes") p -= 0.1;
    rows.push({ candidate_id: `HR-${5000 + i}`, gender, ethnicity, disability, years_experience: years, shortlisted: rand() < p ? "1" : "0" });
  }
  return rows;
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: "credit",
    name: "Credit Lending (synthetic, n=2,400)",
    description: "Retail micro-loan approvals with gender, age band and region.",
    target: "approved",
    positive: "yes",
    protectedAttrs: ["gender", "age_band", "region"],
    rows: creditLending(),
  },
  {
    id: "hiring",
    name: "Hiring Pipeline (synthetic, n=1,800)",
    description: "Résumé shortlisting outcomes with gender, ethnicity and disability.",
    target: "shortlisted",
    positive: "1",
    protectedAttrs: ["gender", "ethnicity", "disability"],
    rows: hiring(),
  },
];

export type GroupStat = {
  group: string;
  n: number;
  share: number;
  positives: number;
  negatives: number;
  rate: number;
  /** Ratio of this group's rate to the most-favoured group's rate. */
  dir: number;
  underrepresented: boolean;
};

export type BiasReport = {
  groups: GroupStat[];
  privileged: string;
  dpd: number;
  dir: number;
  passesFourFifths: boolean;
};

/** Representation floor: groups below this share of rows are flagged. */
export const MIN_SHARE = 0.1;

export function analyzeBias(rows: Row[], attr: string, target: string, positive: string): BiasReport {
  const map = new Map<string, { n: number; pos: number }>();
  for (const r of rows) {
    const g = String(r[attr] ?? "∅");
    const e = map.get(g) ?? { n: 0, pos: 0 };
    e.n++;
    if (String(r[target]) === positive) e.pos++;
    map.set(g, e);
  }
  const total = rows.length || 1;
  const raw = [...map.entries()].map(([group, e]) => ({ group, n: e.n, positives: e.pos, rate: e.n ? e.pos / e.n : 0 }));
  const best = raw.reduce((a, b) => (b.rate > a.rate ? b : a), raw[0]);
  const worst = raw.reduce((a, b) => (b.rate < a.rate ? b : a), raw[0]);
  const groups = raw
    .map((g) => ({
      ...g,
      share: g.n / total,
      negatives: g.n - g.positives,
      dir: best.rate ? g.rate / best.rate : 1,
      underrepresented: g.n / total < MIN_SHARE,
    }))
    .sort((a, b) => b.n - a.n);
  const dir = best.rate ? worst.rate / best.rate : 1;
  return { groups, privileged: best.group, dpd: best.rate - worst.rate, dir, passesFourFifths: dir >= 0.8 };
}

/** Minimal CSV parser (handles quoted fields and commas inside quotes). */
export function parseCsv(text: string): Row[] {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const split = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') q = !q;
      else if (c === "," && !q) {
        out.push(cur);
        cur = "";
      } else cur += c;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const header = split(lines[0]);
  return lines.slice(1).map((l) => {
    const cells = split(l);
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
  });
}

export function toCsv(rows: Row[]) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  return [cols.join(","), ...rows.map((r) => cols.map((c) => r[c]).join(","))].join("\n");
}
