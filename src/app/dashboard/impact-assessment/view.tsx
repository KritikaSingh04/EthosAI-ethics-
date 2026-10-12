"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, Download, Printer } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Meter } from "@/components/ui/meter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AUTONOMY,
  IEEE_VALUES,
  IMPACT_CATEGORIES,
  SEVERITY_LABELS,
  aiaTier,
  type AutonomyLevel,
  type ImpactCategory,
} from "@/lib/mock/aia";
import { cn, downloadText } from "@/lib/utils";

type CategoryKey = ImpactCategory["key"];

type AiaState = {
  name: string;
  owner: string;
  purpose: string;
  sector: string;
  autonomy: AutonomyLevel;
  population: "lt1k" | "lt100k" | "gt100k";
  data: { personal: boolean; biometric: boolean; children: boolean; special: boolean };
  stakeholders: string[];
  rights: { humanReview: boolean; explanation: boolean; optOut: boolean; consultation: boolean };
  impacts: Record<CategoryKey, { severity: number; notes: string; mitigated: boolean }>;
  values: string[];
};

const INITIAL: AiaState = {
  name: "HireRank resume screener",
  owner: "Head of Talent Acquisition",
  purpose: "Rank inbound applications so recruiters review the most relevant 20% first.",
  sector: "Employment",
  autonomy: "human-on-the-loop",
  population: "lt100k",
  data: { personal: true, biometric: false, children: false, special: false },
  stakeholders: ["Job applicants", "Recruiters", "Hiring managers"],
  rights: { humanReview: true, explanation: false, optOut: false, consultation: false },
  impacts: {
    dignity: { severity: 3, notes: "Automated rejection without explanation; risk of proxy discrimination via postcode and college.", mitigated: false },
    environment: { severity: 1, notes: "Small gradient-boosted model; retrained monthly on CPU.", mitigated: true },
    labor: { severity: 2, notes: "Reduces first-pass screening workload; recruiters re-deployed to interviews.", mitigated: true },
    governance: { severity: 3, notes: "No independent audit yet; vendor model partially opaque.", mitigated: false },
  },
  values: ["Fairness", "Transparency", "Accountability"],
};

const STAKEHOLDERS = ["Job applicants", "Recruiters", "Hiring managers", "Disabled applicants", "Regulators", "Works council / unions", "General public"];
const STEPS = ["System profile", "Rights & stakeholders", "Societal impact", "IEEE 7000 values", "Review & export"];

function score(s: AiaState) {
  const sev = IMPACT_CATEGORIES.reduce((acc, c) => {
    const i = s.impacts[c.key];
    return acc + (i.severity / 4) * (i.mitigated ? 0.6 : 1);
  }, 0) / IMPACT_CATEGORIES.length;
  const dataRisk = (s.data.biometric ? 8 : 0) + (s.data.children ? 7 : 0) + (s.data.special ? 6 : 0) + (s.data.personal ? 3 : 0);
  const pop = { lt1k: 0, lt100k: 5, gt100k: 10 }[s.population];
  const rightsGap = Object.values(s.rights).filter((v) => !v).length * 3;
  const mult = AUTONOMY.find((a) => a.value === s.autonomy)!.multiplier;
  return Math.min(100, Math.round((sev * 50 + dataRisk + pop + rightsGap) * mult));
}

function toMarkdown(s: AiaState, total: number) {
  const tier = aiaTier(total);
  const yes = (b: boolean) => (b ? "Yes" : "**No**");
  return [
    `# Algorithmic Impact Assessment — ${s.name}`,
    "",
    `*Framework:* UNESCO Recommendation on the Ethics of AI (2021) · IEEE 7000-2021 Value-Based Engineering`,
    "",
    `| Field | Value |`,
    `|---|---|`,
    `| System owner | ${s.owner} |`,
    `| Sector | ${s.sector} |`,
    `| Autonomy | ${AUTONOMY.find((a) => a.value === s.autonomy)!.label} |`,
    `| Impact score | **${total}/100** |`,
    `| Impact level | **${tier.tier}** |`,
    "",
    `## 1. Purpose`,
    s.purpose,
    "",
    `## 2. Data & affected people`,
    `- Data categories: ${Object.entries(s.data).filter(([, v]) => v).map(([k]) => k).join(", ") || "none declared"}`,
    `- Stakeholders: ${s.stakeholders.join(", ")}`,
    "",
    `## 3. Rights safeguards`,
    `- Human review on request: ${yes(s.rights.humanReview)}`,
    `- Individual explanation: ${yes(s.rights.explanation)}`,
    `- Opt-out of automated processing: ${yes(s.rights.optOut)}`,
    `- Stakeholder consultation held: ${yes(s.rights.consultation)}`,
    "",
    `## 4. Societal impact`,
    ...IMPACT_CATEGORIES.flatMap((c) => {
      const i = s.impacts[c.key];
      return [`### ${c.label} — ${SEVERITY_LABELS[i.severity]}${i.mitigated ? " (mitigated)" : ""}`, `*${c.unesco}*`, "", i.notes || "_No notes._", ""];
    }),
    `## 5. Ethical value requirements (IEEE 7000)`,
    ...IEEE_VALUES.filter((v) => s.values.includes(v.value)).map((v) => `- **${v.value}:** ${v.evr}`),
    "",
    `## 6. Required actions`,
    ...requiredActions(s).map((a) => `- [ ] ${a}`),
    "",
  ].join("\n");
}

function requiredActions(s: AiaState) {
  const out: string[] = [];
  if (!s.rights.explanation) out.push("Provide plain-language reason codes for individual decisions.");
  if (!s.rights.optOut) out.push("Offer an opt-out route to a fully human process.");
  if (!s.rights.consultation) out.push("Run stakeholder consultation, including representatives of affected groups.");
  for (const c of IMPACT_CATEGORIES) {
    const i = s.impacts[c.key];
    if (i.severity >= 3 && !i.mitigated) out.push(`Document and implement mitigation for ${c.label.toLowerCase()} (severity: ${SEVERITY_LABELS[i.severity]}).`);
  }
  if (s.autonomy === "fully-autonomous") out.push("Introduce a human-on-the-loop override for high-stakes decisions.");
  if (!out.length) out.push("Schedule periodic re-assessment (every 12 months or on material change).");
  return out;
}

export function ImpactAssessmentView() {
  const [s, setS] = useState<AiaState>(INITIAL);
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const total = score(s);
  const tier = aiaTier(total);
  const md = toMarkdown(s, total);
  const set = <K extends keyof AiaState>(k: K, v: AiaState[K]) => setS((p) => ({ ...p, [k]: v }));

  return (
    <>
      <PageHeader
        exp={6}
        co="CO3"
        title="UNESCO & IEEE Algorithmic Impact Assessment"
        description="A guided assessment operationalising the UNESCO Recommendation on the Ethics of AI and IEEE 7000 value-based engineering. Answers feed a live impact score and an exportable audit report."
        actions={<StatusBadge tone={tier.tone}>{tier.tier}</StatusBadge>}
      />

      <div className="grid gap-4 xl:grid-cols-[240px_1fr_280px]">
        <Card className="h-fit">
          <ol className="p-2">
            {STEPS.map((label, i) => (
              <li key={label}>
                <button
                  onClick={() => setStep(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-[13px]",
                    i === step ? "bg-surface-2 font-medium text-fg" : "text-fg-2 hover:bg-surface-2/60",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-mono",
                      i < step ? "border-accent bg-accent text-accent-fg" : i === step ? "border-fg text-fg" : "border-line-strong text-muted",
                    )}
                  >
                    {i < step ? <Check className="size-3" /> : i + 1}
                  </span>
                  {label}
                </button>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="min-w-0">
          <CardHeader title={`Step ${step + 1} · ${STEPS[step]}`} description={stepHint[step]} />
          <CardBody className="space-y-5">
            {step === 0 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="System name">
                    <Input value={s.name} onChange={(v) => set("name", v)} />
                  </Field>
                  <Field label="Accountable owner">
                    <Input value={s.owner} onChange={(v) => set("owner", v)} />
                  </Field>
                </div>
                <Field label="Purpose & intended use">
                  <Textarea value={s.purpose} onChange={(v) => set("purpose", v)} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Sector">
                    <Select
                      className="w-full"
                      value={s.sector}
                      onChange={(e) => set("sector", e.target.value)}
                      options={["Employment", "Financial services", "Healthcare", "Education", "Public sector", "Law enforcement"].map((x) => ({ value: x, label: x }))}
                    />
                  </Field>
                  <Field label="People affected per year">
                    <Select
                      className="w-full"
                      value={s.population}
                      onChange={(e) => set("population", e.target.value as AiaState["population"])}
                      options={[
                        { value: "lt1k", label: "Fewer than 1,000" },
                        { value: "lt100k", label: "1,000 – 100,000" },
                        { value: "gt100k", label: "More than 100,000" },
                      ]}
                    />
                  </Field>
                </div>
                <Field label="Level of autonomy">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {AUTONOMY.map((a) => (
                      <button
                        key={a.value}
                        onClick={() => set("autonomy", a.value)}
                        className={cn(
                          "rounded-md border px-3 py-2 text-left text-xs",
                          s.autonomy === a.value ? "border-accent bg-accent/5 text-fg" : "border-line text-fg-2 hover:bg-surface-2",
                        )}
                      >
                        {a.label}
                        <span className="mt-0.5 block font-mono text-[10px] text-muted">× {a.multiplier} risk weight</span>
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Data categories processed">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(
                      [
                        ["personal", "Personal data"],
                        ["biometric", "Biometric data"],
                        ["children", "Children's data"],
                        ["special", "Special category (health, caste, religion…)"],
                      ] as const
                    ).map(([k, label]) => (
                      <Toggle key={k} label={label} checked={s.data[k]} onChange={(v) => set("data", { ...s.data, [k]: v })} />
                    ))}
                  </div>
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <Field label="Affected stakeholders">
                  <div className="flex flex-wrap gap-1.5">
                    {STAKEHOLDERS.map((x) => {
                      const on = s.stakeholders.includes(x);
                      return (
                        <button
                          key={x}
                          onClick={() => set("stakeholders", on ? s.stakeholders.filter((y) => y !== x) : [...s.stakeholders, x])}
                          className={cn(
                            "inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-xs",
                            on ? "border-fg bg-fg text-bg" : "border-line text-fg-2 hover:bg-surface-2",
                          )}
                        >
                          {on && <Check className="size-3" />}
                          {x}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <Field label="Rights safeguards (UNESCO: human oversight & determination)">
                  <div className="grid gap-2">
                    <Toggle label="Affected people can request human review" checked={s.rights.humanReview} onChange={(v) => set("rights", { ...s.rights, humanReview: v })} />
                    <Toggle label="Individual explanations are provided" checked={s.rights.explanation} onChange={(v) => set("rights", { ...s.rights, explanation: v })} />
                    <Toggle label="Opt-out of automated processing available" checked={s.rights.optOut} onChange={(v) => set("rights", { ...s.rights, optOut: v })} />
                    <Toggle label="Multi-stakeholder consultation completed" checked={s.rights.consultation} onChange={(v) => set("rights", { ...s.rights, consultation: v })} />
                  </div>
                </Field>
              </>
            )}

            {step === 2 &&
              IMPACT_CATEGORIES.map((c) => {
                const i = s.impacts[c.key];
                const upd = (patch: Partial<typeof i>) => set("impacts", { ...s.impacts, [c.key]: { ...i, ...patch } });
                return (
                  <div key={c.key} className="rounded-md border border-line p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="text-[13px] font-medium text-fg">{c.label}</div>
                        <div className="text-[11px] text-muted">{c.unesco}</div>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-fg-2">
                        Mitigation in place <Switch checked={i.mitigated} onCheckedChange={(v) => upd({ mitigated: v })} />
                      </label>
                    </div>
                    <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[11px] text-fg-2">
                      {c.prompts.map((p) => <li key={p}>{p}</li>)}
                    </ul>
                    <Slider
                      className="mt-3"
                      label="Severity"
                      valueLabel={SEVERITY_LABELS[i.severity]}
                      value={[i.severity]}
                      min={0}
                      max={4}
                      step={1}
                      onValueChange={([n]) => upd({ severity: n })}
                    />
                    <Textarea className="mt-3" rows={2} value={i.notes} onChange={(v) => upd({ notes: v })} placeholder="Evidence and reasoning…" />
                  </div>
                );
              })}

            {step === 3 && (
              <div className="space-y-2">
                {IEEE_VALUES.map((v) => {
                  const on = s.values.includes(v.value);
                  return (
                    <label key={v.value} className={cn("flex cursor-pointer gap-3 rounded-md border p-3", on ? "border-accent bg-accent/5" : "border-line")}>
                      <input
                        type="checkbox"
                        className="mt-0.5 accent-[var(--accent)]"
                        checked={on}
                        onChange={() => set("values", on ? s.values.filter((x) => x !== v.value) : [...s.values, v.value])}
                      />
                      <span>
                        <span className="block text-[13px] font-medium text-fg">{v.value}</span>
                        <span className="block text-xs text-fg-2">EVR: {v.evr}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {step === 4 && (
              <Tabs defaultValue="preview">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <TabsList>
                    <TabsTrigger value="preview">Report preview</TabsTrigger>
                    <TabsTrigger value="markdown">Markdown</TabsTrigger>
                  </TabsList>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(md);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                    >
                      {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button size="sm" onClick={() => downloadText(`AIA-${s.name.replace(/\s+/g, "-")}.md`, md)}>
                      <Download /> .md
                    </Button>
                    <Button size="sm" variant="primary" onClick={() => window.print()}>
                      <Printer /> Export PDF
                    </Button>
                  </div>
                </div>
                <TabsContent value="preview" className="mt-3">
                  <ReportPreview s={s} total={total} />
                </TabsContent>
                <TabsContent value="markdown" className="mt-3">
                  <pre className="max-h-[560px] overflow-auto rounded-md border border-line bg-surface-2 p-4 font-mono text-[11px] leading-relaxed text-fg-2">{md}</pre>
                </TabsContent>
              </Tabs>
            )}

            <div className="flex justify-between border-t border-line pt-4">
              <Button disabled={step === 0} onClick={() => setStep((x) => x - 1)}>
                <ArrowLeft /> Back
              </Button>
              {step < STEPS.length - 1 && (
                <Button variant="primary" onClick={() => setStep((x) => x + 1)}>
                  Next <ArrowRight />
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Live impact score" />
            <CardBody>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">{total}</span>
                <span className="text-sm text-muted">/ 100</span>
              </div>
              <Meter className="mt-3" value={total / 100} color={`var(--${tier.tone})`} />
              <div className="mt-3">
                <StatusBadge tone={tier.tone}>{tier.tier}</StatusBadge>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Societal impact profile" />
            <ul className="divide-y divide-line">
              {IMPACT_CATEGORIES.map((c) => {
                const i = s.impacts[c.key];
                return (
                  <li key={c.key} className="px-4 py-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-fg">{c.label}</span>
                      <span className="text-muted">{SEVERITY_LABELS[i.severity]}</span>
                    </div>
                    <Meter className="mt-1.5" value={i.severity / 4} color={i.mitigated ? "var(--series-1)" : "var(--serious)"} />
                    {i.mitigated && <span className="mt-1 block text-[10px] text-good-text">✓ Mitigated</span>}
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Required actions" description={`${requiredActions(s).length} open`} />
            <ul className="space-y-2 p-4 text-xs text-fg-2">
              {requiredActions(s).map((a) => (
                <li key={a} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-serious" />
                  {a}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

const stepHint = [
  "Describe the system, who owns it, and how autonomously it acts.",
  "Identify affected people and the safeguards protecting their rights.",
  "Rate severity across UNESCO policy areas and record mitigations.",
  "Select the stakeholder values to translate into ethical value requirements (EVRs).",
  "Review the generated report and export it as Markdown or PDF.",
];

function ReportPreview({ s, total }: { s: AiaState; total: number }) {
  const tier = aiaTier(total);
  return (
    <article data-print-root className="rounded-md border border-line bg-surface p-6 text-[13px] leading-relaxed text-fg">
      <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted">Algorithmic Impact Assessment</div>
          <h2 className="mt-1 text-lg font-semibold">{s.name}</h2>
          <div className="text-xs text-muted">Owner: {s.owner} · {s.sector}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold">{total}/100</div>
          <StatusBadge tone={tier.tone}>{tier.tier}</StatusBadge>
        </div>
      </div>
      <Section title="Purpose">{s.purpose}</Section>
      <Section title="Societal impact">
        <table className="w-full text-xs">
          <tbody>
            {IMPACT_CATEGORIES.map((c) => (
              <tr key={c.key} className="border-b border-line align-top">
                <td className="py-1.5 pr-3 font-medium">{c.label}</td>
                <td className="py-1.5 pr-3 whitespace-nowrap">{SEVERITY_LABELS[s.impacts[c.key].severity]}{s.impacts[c.key].mitigated ? " · mitigated" : ""}</td>
                <td className="py-1.5 text-fg-2">{s.impacts[c.key].notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Section title="Ethical value requirements (IEEE 7000)">
        <ul className="list-disc space-y-1 pl-5 text-xs">
          {IEEE_VALUES.filter((v) => s.values.includes(v.value)).map((v) => (
            <li key={v.value}>
              <b>{v.value}:</b> {v.evr}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Required actions">
        <ul className="list-disc space-y-1 pl-5 text-xs">
          {requiredActions(s).map((a) => <li key={a}>{a}</li>)}
        </ul>
      </Section>
      <p className="mt-6 text-[10px] text-muted">
        Generated by EthosAI · UNESCO Recommendation on the Ethics of AI (2021) · IEEE 7000-2021 · <Badge>Draft</Badge>
      </p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fg-2">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium text-fg-2">{label}</div>
      {children}
    </div>
  );
}

function Input({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-full rounded-md border border-line bg-surface px-2.5 text-xs text-fg outline-none focus:ring-4 focus:ring-accent/20"
    />
  );
}

function Textarea({
  value,
  onChange,
  rows = 3,
  className,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  className?: string;
  placeholder?: string;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn("w-full resize-y rounded-md border border-line bg-surface px-2.5 py-2 text-xs text-fg outline-none placeholder:text-muted focus:ring-4 focus:ring-accent/20", className)}
    />
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2 text-xs text-fg-2">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
