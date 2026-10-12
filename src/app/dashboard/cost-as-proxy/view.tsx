"use client";

import { useMemo, useState } from "react";
import { Download, Info } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Stat } from "@/components/ui/stat";
import { StatusBadge } from "@/components/ui/badge";
import { ChartTooltip, Legend, axisProps, gridProps } from "@/components/charts/chart-kit";
import { allocate, disparityCurve, generateCohort, riskScores, type CurvePoint } from "@/lib/mock/cost-proxy";
import { downloadJson, pct } from "@/lib/utils";

const BLACK = "var(--series-1)";
const WHITE = "var(--series-2)";

export function CostProxyView() {
  const [percentile, setPercentile] = useState(97);
  const [accessGap, setAccessGap] = useState(0.3);
  const [mitigate, setMitigate] = useState(false);
  const [alpha, setAlpha] = useState(1);

  const cohort = useMemo(() => generateCohort(6000, accessGap), [accessGap]);
  const costScores = useMemo(() => riskScores(cohort, 0), [cohort]);
  const needScores = useMemo(() => riskScores(cohort, 1), [cohort]);
  const deployedAlpha = mitigate ? alpha : 0;
  const deployedScores = useMemo(() => riskScores(cohort, deployedAlpha), [cohort, deployedAlpha]);

  const costCurve = useMemo(() => disparityCurve(cohort, costScores), [cohort, costScores]);
  const needCurve = useMemo(() => disparityCurve(cohort, needScores), [cohort, needScores]);

  const costAlloc = allocate(cohort, costScores, percentile);
  const needAlloc = allocate(cohort, needScores, percentile);
  const deployed = allocate(cohort, deployedScores, percentile);
  const popBlackShare = cohort.filter((p) => p.race === "Black").length / cohort.length;

  const shareData = [
    { label: "Cost target", share: costAlloc.blackShare },
    { label: "Need target", share: needAlloc.blackShare },
    ...(mitigate && alpha < 1 ? [{ label: `Blend α=${alpha.toFixed(2)}`, share: deployed.blackShare }] : []),
  ].map((d) => ({ ...d, "Black share of enrolled": +(d.share * 100).toFixed(1) }));

  const gap = deployed.meanChronic.Black - deployed.meanChronic.White;

  return (
    <>
      <PageHeader
        exp={4}
        co="CO3"
        title="Cost-as-a-Proxy Resource Bias Audit"
        description="Simulates the mechanism documented by Obermeyer et al. (Science, 2019): a care-management model trained to predict healthcare cost under-refers Black patients, because unequal access means less is spent on them at the same level of illness."
        actions={
          <Button
            variant="primary"
            onClick={() =>
              downloadJson("cost-proxy-audit.json", {
                cohortSize: cohort.length,
                accessGap,
                enrollmentPercentile: percentile,
                deployedLabel: mitigate ? `blend alpha=${alpha}` : "cost",
                costTarget: costAlloc,
                needTarget: needAlloc,
                deployed,
              })
            }
          >
            <Download /> Export audit
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader title="Simulation controls" description="Synthetic cohort · n = 6,000" />
          <CardBody className="space-y-5">
            <Slider
              label="Auto-enrolment cut-off (risk percentile)"
              valueLabel={`P${percentile}`}
              value={[percentile]}
              min={55}
              max={99}
              step={1}
              onValueChange={([n]) => setPercentile(n)}
            />
            <Slider
              label="Access-to-care gap (Black patients)"
              valueLabel={pct(accessGap, 0)}
              value={[accessGap]}
              min={0}
              max={0.5}
              step={0.01}
              onValueChange={([n]) => setAccessGap(n)}
            />
            <div className="rounded-md border border-line p-3">
              <label className="flex items-center justify-between gap-3">
                <span>
                  <span className="block text-xs font-medium text-fg">Mitigation: re-label target</span>
                  <span className="block text-[11px] text-muted">Train on health need instead of cost</span>
                </span>
                <Switch checked={mitigate} onCheckedChange={setMitigate} aria-label="Enable mitigation" />
              </label>
              {mitigate && (
                <Slider
                  className="mt-4"
                  label="Label blend α (0 = cost, 1 = need)"
                  valueLabel={alpha.toFixed(2)}
                  value={[alpha]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={([n]) => setAlpha(n)}
                />
              )}
            </div>
            <p className="flex gap-2 text-[11px] leading-relaxed text-muted">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Risk scores are re-ranked and the enrolment threshold is recalculated at P{percentile} every time the label changes.
            </p>
          </CardBody>
        </Card>

        <div className="min-w-0 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Deployed label"
              value={mitigate ? (alpha === 1 ? "Health need" : `Blend ${alpha.toFixed(2)}`) : "Cost"}
              badge={<StatusBadge tone={mitigate ? "good" : "critical"}>{mitigate ? "Mitigated" : "Proxy bias"}</StatusBadge>}
            />
            <Stat label="Black share of enrolled" value={pct(deployed.blackShare)} hint={`Population share ${pct(popBlackShare)}`} />
            <Stat
              label="Sicker-at-same-score gap"
              value={`${gap >= 0 ? "+" : ""}${gap.toFixed(2)}`}
              hint="Mean chronic conditions, Black − White (enrolled)"
              badge={<StatusBadge tone={gap > 0.5 ? "serious" : "good"}>{gap > 0.5 ? "Inequitable" : "Parity"}</StatusBadge>}
            />
            <Stat label="High-need patients missed" value={pct(deployed.missedHighNeed)} hint="≥ 5 chronic conditions, not enrolled" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <CurveCard title="Model trained on cost" description="Status quo — the proxy label" data={costCurve} percentile={percentile} />
            <CurveCard title="Model trained on health need" description="Mitigated — curves overlap when need is ranked fairly" data={needCurve} percentile={percentile} />
          </div>

          <Card>
            <CardHeader
              title="Who gets the extra care?"
              description={`Black patients as a share of those auto-enrolled at P${percentile}`}
            />
            <CardBody>
              <div className="h-36">
                <ResponsiveContainer>
                  <BarChart data={shareData} layout="vertical" margin={{ left: 8, right: 24 }}>
                    <CartesianGrid {...gridProps} vertical horizontal={false} />
                    <XAxis type="number" domain={[0, 60]} unit="%" {...axisProps} />
                    <YAxis type="category" dataKey="label" width={100} {...axisProps} />
                    <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip valueFormatter={(v) => `${v}%`} />} />
                    <Bar dataKey="Black share of enrolled" fill={BLACK} radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={false} label={{ position: "right", fill: "var(--fg-2)", fontSize: 11, formatter: (v: unknown) => `${v}%` }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-muted">
                Obermeyer et al. report the share of Black patients flagged for extra help would rise from 17.7% to 46.5% if the bias were removed.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function CurveCard({
  title,
  description,
  data,
  percentile,
}: {
  title: string;
  description: string;
  data: CurvePoint[];
  percentile: number;
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody>
        <div className="h-60">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ right: 8, top: 4, bottom: 12 }}>
              <CartesianGrid {...gridProps} />
              <ReferenceArea x1={percentile} x2={100} fill="var(--accent)" fillOpacity={0.1} />
              <XAxis dataKey="percentile" type="number" domain={[5, 100]} ticks={[20, 40, 60, 80, 100]} {...axisProps} label={{ value: "Risk score percentile", position: "insideBottom", offset: -8, fill: "var(--axis)", fontSize: 11 }} height={32} />
              <YAxis {...axisProps} width={32} domain={[0, "auto"]} />
              <Tooltip content={<ChartTooltip labelFormatter={(l) => `Percentile ${l}`} valueFormatter={(v) => `${v.toFixed(2)} conditions`} />} />
              <Line type="monotone" dataKey="Black" stroke={BLACK} strokeWidth={2} dot={{ r: 3, fill: BLACK, stroke: "var(--surface)", strokeWidth: 2 }} connectNulls />
              <Line type="monotone" dataKey="White" stroke={WHITE} strokeWidth={2} dot={{ r: 3, fill: WHITE, stroke: "var(--surface)", strokeWidth: 2 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <Legend items={[{ label: "Black patients", color: BLACK }, { label: "White patients", color: WHITE }]} />
          <span className="text-[11px] text-muted">Shaded = auto-enrolled</span>
        </div>
        <p className="mt-1 text-[11px] text-muted">Y-axis: mean active chronic conditions</p>
      </CardBody>
    </Card>
  );
}
