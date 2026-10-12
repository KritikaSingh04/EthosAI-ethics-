import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { MODULES } from "@/components/shell/nav";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge, StatusBadge, type Tone } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { APPLICATIONS, complianceScore } from "@/lib/mock/ethics";
import { SAMPLE_DATASETS, analyzeBias } from "@/lib/mock/datasets";
import { CASES } from "@/lib/mock/regulations";

const COURSE_OUTCOMES = [
  { co: "CO1", text: "Demonstrate understanding of ethical principles in AI" },
  { co: "CO2", text: "Identify and mitigate bias and fairness, privacy issues" },
  { co: "CO3", text: "Understand societal impacts" },
  { co: "CO4", text: "Design AI systems with accountability, transparency, and fairness" },
];

// Static audit trail for the overview; each module also produces its own exports.
const ACTIVITY: { when: string; module: string; event: string; tone: Tone; status: string }[] = [
  { when: "09:42", module: "Dataset Bias", event: "Credit Lending · region DIR 0.41 below 4/5ths rule", tone: "critical", status: "Failed" },
  { when: "09:31", module: "Target & Drift", event: "Batch B31 PSI 0.27 → circuit breaker engaged", tone: "serious", status: "Halted" },
  { when: "09:10", module: "Deepfake Audit", event: "campaign_ad_v3.mp4 · C2PA AI-generated assertion found", tone: "warning", status: "Labelled" },
  { when: "08:55", module: "Impact Assessment", event: "AIA draft for HireRank exported (Level III)", tone: "accent", status: "Exported" },
  { when: "08:20", module: "Fairness & XAI", event: "Group-specific thresholds reduced EO gap to 1.8 pp", tone: "good", status: "Mitigated" },
];

export function OverviewView() {
  const avgCompliance = APPLICATIONS.reduce((s, a) => s + complianceScore(a.scores), 0) / APPLICATIONS.length;
  const failingDatasets = SAMPLE_DATASETS.flatMap((d) =>
    d.protectedAttrs.map((a) => analyzeBias(d.rows, a, d.target, d.positive)),
  ).filter((r) => !r.passesFourFifths).length;
  const totalChecks = SAMPLE_DATASETS.reduce((s, d) => s + d.protectedAttrs.length, 0);

  return (
    <>
      <PageHeader
        title="Audit overview"
        description="Ethics for AI & Data Science Laboratory — eight audit modules mapped to the experiment list. Every module runs locally on deterministic mock data and exports its findings."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Systems under audit" value={APPLICATIONS.length} hint="Across 5 sectors" />
        <Stat
          label="Mean ethics compliance"
          value={`${avgCompliance.toFixed(0)}/100`}
          hint="Weighted UNESCO/IEEE pillars"
          badge={<StatusBadge tone={avgCompliance >= 65 ? "good" : "warning"}>{avgCompliance >= 65 ? "On track" : "Below baseline"}</StatusBadge>}
        />
        <Stat
          label="Four-fifths rule violations"
          value={`${failingDatasets}/${totalChecks}`}
          hint="Protected-attribute checks"
          badge={<StatusBadge tone="critical">Action needed</StatusBadge>}
        />
        <Stat label="Case library" value={CASES.length} hint="Tagged by EU AI Act tier" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Lab modules" description="Experiment → route → course outcome" />
          <div className="grid divide-line sm:grid-cols-2 sm:divide-x">
            {[MODULES.slice(0, 4), MODULES.slice(4)].map((col, ci) => (
              <ul key={ci} className="divide-y divide-line">
                {col.map((m) => (
                  <li key={m.href}>
                    <Link href={m.href} className="group flex items-center gap-3 px-4 py-3 hover:bg-surface-2/60">
                      <span className="font-mono text-[11px] text-muted tabular">{String(m.exp).padStart(2, "0")}</span>
                      <m.icon className="size-4 text-muted group-hover:text-accent" />
                      <span className="min-w-0 flex-1 truncate text-[13px] text-fg">{m.label}</span>
                      <Badge tone="accent">{m.co}</Badge>
                      <ArrowUpRight className="size-3.5 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Course outcomes" description="LY B.Tech (AI&DS) · Sem VII" />
          <ul className="divide-y divide-line">
            {COURSE_OUTCOMES.map((c) => (
              <li key={c.co} className="flex gap-3 px-4 py-3">
                <Badge tone="accent" className="h-fit">{c.co}</Badge>
                <div className="min-w-0">
                  <p className="text-[13px] text-fg">{c.text}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    Exp {MODULES.filter((m) => m.co === c.co).map((m) => m.exp).join(", ")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Recent audit activity" description="Latest events across modules" />
        <Table>
          <thead>
            <tr>
              <Th className="w-20">Time</Th>
              <Th className="w-40">Module</Th>
              <Th>Event</Th>
              <Th className="w-28 text-right">Status</Th>
            </tr>
          </thead>
          <tbody>
            {ACTIVITY.map((a) => (
              <Tr key={a.event}>
                <Td className="font-mono tabular text-muted">{a.when}</Td>
                <Td className="text-fg">{a.module}</Td>
                <Td>{a.event}</Td>
                <Td className="text-right">
                  <StatusBadge tone={a.tone}>{a.status}</StatusBadge>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
