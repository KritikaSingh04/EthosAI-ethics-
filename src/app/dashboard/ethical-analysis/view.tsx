"use client";

import { useMemo, useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RiskBadge, StatusBadge, riskTone } from "@/components/ui/badge";
import { Meter } from "@/components/ui/meter";
import { ChartTooltip, Legend } from "@/components/charts/chart-kit";
import {
  APPLICATIONS,
  BASELINE,
  DIMENSIONS,
  complianceScore,
  likelihood,
  riskForScore,
  type DimensionKey,
} from "@/lib/mock/ethics";
import { cn, downloadJson } from "@/lib/utils";

const cellTone = (l: number, i: number) => {
  const s = l * i;
  if (s >= 16) return "bg-critical/25";
  if (s >= 10) return "bg-serious/25";
  if (s >= 5) return "bg-warning/20";
  return "bg-good/15";
};

export function EthicalAnalysisView() {
  const [appId, setAppId] = useState(APPLICATIONS[0].id);
  const app = APPLICATIONS.find((a) => a.id === appId)!;
  const [scores, setScores] = useState<Record<DimensionKey, number>>(app.scores);

  const selectApp = (id: string) => {
    setAppId(id);
    setScores(APPLICATIONS.find((a) => a.id === id)!.scores);
  };

  const compliance = complianceScore(scores);
  const overall = riskForScore(compliance);

  const radarData = DIMENSIONS.map((d) => ({ pillar: d.pillar, Current: scores[d.key], Baseline: BASELINE }));

  const flags = useMemo(
    () =>
      DIMENSIONS.map((d) => ({ d, score: scores[d.key], level: riskForScore(scores[d.key]), impact: app.impact[d.key] }))
        .filter((f) => f.level !== "low")
        .sort((a, b) => likelihood(b.score) * b.impact - likelihood(a.score) * a.impact || a.score - b.score),
    [scores, app],
  );

  const exportAudit = () =>
    downloadJson(`ethics-audit-${app.id}.json`, {
      system: app.name,
      sector: app.sector,
      complianceScore: +compliance.toFixed(1),
      overallRisk: overall,
      dimensions: DIMENSIONS.map((d) => ({
        dimension: d.label,
        unesco: d.unesco,
        ieee: d.ieee,
        maturity: scores[d.key],
        risk: riskForScore(scores[d.key]),
        likelihood: likelihood(scores[d.key]),
        impact: app.impact[d.key],
      })),
    });

  return (
    <>
      <PageHeader
        exp={1}
        co="CO1"
        title="Ethical Principles & Risk Scoring"
        description="Score an AI application's control maturity against UNESCO's Recommendation on the Ethics of AI and the IEEE 7000-series. Risk combines how likely a control gap is to materialise with its impact in the deployment context."
        actions={
          <>
            <Select
              aria-label="Application"
              value={appId}
              onChange={(e) => selectApp(e.target.value)}
              options={APPLICATIONS.map((a) => ({ value: a.id, label: a.name }))}
              className="w-60"
            />
            <Button onClick={() => setScores(app.scores)}>
              <RotateCcw /> Reset
            </Button>
            <Button variant="primary" onClick={exportAudit}>
              <Download /> Export audit
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader
            title="Evaluation matrix"
            description={`${app.sector} · ${app.description}`}
          />
          <ul className="divide-y divide-line">
            {DIMENSIONS.map((d) => {
              const v = scores[d.key];
              return (
                <li key={d.key} className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_220px] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-medium text-fg">{d.label}</span>
                      <RiskBadge level={riskForScore(v)} />
                    </div>
                    <p className="mt-0.5 text-xs text-fg-2">{d.question}</p>
                    <p className="mt-1 text-[11px] text-muted">
                      UNESCO: {d.unesco} · {d.ieee}
                    </p>
                  </div>
                  <Slider
                    label="Control maturity"
                    valueLabel={`${v}/100`}
                    value={[v]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([n]) => setScores((s) => ({ ...s, [d.key]: n }))}
                  />
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader title="Compliance score" description={`Weighted across ${DIMENSIONS.length} pillars · baseline ${BASELINE}`} action={<RiskBadge level={overall} />} />
            <CardBody>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">{compliance.toFixed(0)}</span>
                <span className="text-sm text-muted">/ 100</span>
              </div>
              <Meter
                className="mt-3"
                value={compliance / 100}
                threshold={BASELINE / 100}
                color={`var(--${riskTone[overall]})`}
              />
              <div className="mt-2 flex justify-between text-[11px] text-muted">
                <span>0</span>
                <span>Baseline {BASELINE}</span>
                <span>100</span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Pillar coverage" description="Control maturity vs. organisational baseline" />
            <CardBody>
              <div className="h-72">
                <ResponsiveContainer>
                  <RadarChart data={radarData} outerRadius="72%">
                    <PolarGrid stroke="var(--grid)" />
                    <PolarAngleAxis dataKey="pillar" tick={{ fill: "var(--fg-2)", fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Baseline" dataKey="Baseline" stroke="var(--axis)" strokeDasharray="4 3" strokeWidth={1.5} fill="none" isAnimationActive={false} />
                    <Radar name={app.name} dataKey="Current" stroke="var(--series-1)" strokeWidth={2} fill="var(--series-1)" fillOpacity={0.15} dot={{ r: 3, fill: "var(--series-1)" }} />
                    <Tooltip content={<ChartTooltip valueFormatter={(v) => `${v}/100`} />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <Legend items={[{ label: app.name, color: "var(--series-1)" }, { label: `Baseline (${BASELINE})`, color: "var(--axis)", dashed: true }]} />
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader title="Risk matrix" description="Likelihood (from control gap) × contextual impact" />
          <CardBody>
            <div className="flex gap-2">
              <div className="flex w-4 items-center justify-center">
                <span className="-rotate-90 whitespace-nowrap text-[11px] text-muted">Impact →</span>
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-5 gap-1">
                  {[5, 4, 3, 2, 1].map((imp) =>
                    [1, 2, 3, 4, 5].map((lik) => {
                      const here = DIMENSIONS.filter((d) => app.impact[d.key] === imp && likelihood(scores[d.key]) === lik);
                      return (
                        <div
                          key={`${imp}-${lik}`}
                          className={cn("flex min-h-14 flex-wrap content-start gap-1 rounded p-1", cellTone(lik, imp))}
                          title={`Likelihood ${lik} × Impact ${imp} = ${lik * imp}`}
                        >
                          {here.map((d) => (
                            <span key={d.key} className="rounded bg-surface px-1 py-0.5 text-[10px] font-medium text-fg shadow-[0_0_0_1px_var(--ring)]">
                              {d.pillar}
                            </span>
                          ))}
                        </div>
                      );
                    }),
                  )}
                </div>
                <div className="mt-1.5 grid grid-cols-5 text-center text-[10px] text-muted tabular">
                  {[1, 2, 3, 4, 5].map((n) => <span key={n}>{n}</span>)}
                </div>
                <div className="text-center text-[11px] text-muted">Likelihood →</div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader title="Risk flags" description={`${flags.length} pillar${flags.length === 1 ? "" : "s"} below the low-risk band`} />
          {flags.length === 0 ? (
            <CardBody>
              <StatusBadge tone="good">All pillars in the low-risk band</StatusBadge>
            </CardBody>
          ) : (
            <ul className="divide-y divide-line">
              {flags.map(({ d, score, level, impact }) => (
                <li key={d.key} className="flex items-start gap-3 px-4 py-2.5">
                  <RiskBadge level={level} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-fg">{d.label}</div>
                    <div className="text-xs text-muted">
                      Maturity {score} · likelihood {likelihood(score)} · impact {impact} · gap to baseline{" "}
                      {Math.max(0, BASELINE - score)} pts
                    </div>
                  </div>
                  <span className="font-mono text-xs text-fg-2 tabular">{likelihood(score) * impact}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
