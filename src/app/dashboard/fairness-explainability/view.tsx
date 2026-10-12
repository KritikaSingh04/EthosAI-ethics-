"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Download, Scale, Sparkles, Wand2 } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { ChartTooltip, Legend, axisProps, gridProps } from "@/components/charts/chart-kit";
import {
  APPLICANTS,
  FEATURES,
  INTERCEPT,
  generatePredictions,
  groupMetrics,
  logit,
  sigmoid,
  type GroupMetrics,
} from "@/lib/mock/fairness";
import { downloadJson, pct } from "@/lib/utils";

const A = "var(--series-1)";
const B = "var(--series-2)";
const TOLERANCE = 0.05;

export function FairnessView() {
  return (
    <>
      <PageHeader
        exp={5}
        co="CO2"
        title="Fairness Metrics & Explainability Inspector"
        description="Audit a loan-approval classifier against group fairness definitions, apply post-processing thresholds, and explain individual decisions with additive feature attributions and counterfactuals."
      />
      <Tabs defaultValue="fairness">
        <TabsList className="mb-4">
          <TabsTrigger value="fairness">
            <Scale /> Fairness metrics
          </TabsTrigger>
          <TabsTrigger value="xai">
            <Sparkles /> Explainability
          </TabsTrigger>
        </TabsList>
        <TabsContent value="fairness">
          <FairnessPane />
        </TabsContent>
        <TabsContent value="xai">
          <ExplainPane />
        </TabsContent>
      </Tabs>
    </>
  );
}

function FairnessPane() {
  const data = useMemo(() => generatePredictions(), []);
  const [tA, setTA] = useState(0.5);
  const [tB, setTB] = useState(0.5);
  const [perGroup, setPerGroup] = useState(false);
  const thresholds = { "Group A": tA, "Group B": perGroup ? tB : tA };
  const [ga, gb] = groupMetrics(data, thresholds);

  /** Post-processing: pick Group B's threshold that best equalises TPR (Hardt et al., 2016). */
  const equaliseOpportunity = () => {
    let best = tA;
    let bestGap = Infinity;
    for (let t = 0.1; t <= 0.9; t += 0.005) {
      const [, b] = groupMetrics(data, { "Group A": tA, "Group B": t });
      const g = Math.abs(b.tpr - ga.tpr);
      if (g < bestGap) {
        bestGap = g;
        best = t;
      }
    }
    setPerGroup(true);
    setTB(+best.toFixed(3));
  };

  const rows: { metric: string; def: string; key: keyof GroupMetrics; criterion?: string }[] = [
    { metric: "Demographic parity", def: "P(Ŷ=1 | G) equal across groups", key: "selectionRate", criterion: "Demographic parity" },
    { metric: "Equal opportunity", def: "TPR = P(Ŷ=1 | Y=1, G) equal", key: "tpr", criterion: "Equal opportunity" },
    { metric: "Equalized odds (FPR)", def: "TPR and FPR both equal", key: "fpr", criterion: "Equalized odds" },
    { metric: "Predictive parity", def: "Precision P(Y=1 | Ŷ=1, G) equal", key: "precision" },
    { metric: "Accuracy", def: "Overall correctness per group", key: "accuracy" },
  ];

  const eoddsGap = Math.max(Math.abs(ga.tpr - gb.tpr), Math.abs(ga.fpr - gb.fpr));

  // Score histograms per group
  const hist = useMemo(() => {
    const bins = 25;
    const out = Array.from({ length: bins }, (_, i) => ({ score: +((i + 0.5) / bins).toFixed(2), "Group A": 0, "Group B": 0 }));
    for (const d of data) out[Math.min(bins - 1, Math.floor(d.score * bins))][d.group]++;
    return out;
  }, [data]);

  const barData = [
    { metric: "Selection rate", "Group A": ga.selectionRate, "Group B": gb.selectionRate },
    { metric: "TPR", "Group A": ga.tpr, "Group B": gb.tpr },
    { metric: "FPR", "Group A": ga.fpr, "Group B": gb.fpr },
    { metric: "Precision", "Group A": ga.precision, "Group B": gb.precision },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
      <Card className="h-fit">
        <CardHeader title="Decision thresholds" description={`${data.length.toLocaleString()} scored applicants`} />
        <CardBody className="space-y-5">
          <Slider
            label={perGroup ? "Group A threshold" : "Global threshold"}
            valueLabel={tA.toFixed(3)}
            value={[tA]}
            min={0.1}
            max={0.9}
            step={0.005}
            onValueChange={([n]) => setTA(n)}
          />
          <label className="flex items-center justify-between gap-3">
            <span className="text-xs text-fg-2">Group-specific thresholds</span>
            <Switch checked={perGroup} onCheckedChange={setPerGroup} />
          </label>
          {perGroup && (
            <Slider
              label="Group B threshold"
              valueLabel={tB.toFixed(3)}
              value={[tB]}
              min={0.1}
              max={0.9}
              step={0.005}
              onValueChange={([n]) => setTB(n)}
            />
          )}
          <Button className="w-full" onClick={equaliseOpportunity}>
            <Wand2 /> Equalise opportunity
          </Button>
          <p className="text-[11px] leading-relaxed text-muted">
            Group-specific thresholds are a post-processing mitigation. They can satisfy equal opportunity but may be
            restricted as disparate treatment in some jurisdictions — document the legal basis.
          </p>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => downloadJson("fairness-metrics.json", { thresholds, groups: [ga, gb], equalizedOddsGap: eoddsGap })}
          >
            <Download /> Export metrics
          </Button>
        </CardBody>
      </Card>

      <div className="min-w-0 space-y-4">
        <Card>
          <CardHeader
            title="Fairness metric comparison"
            description={`Tolerance ±${pct(TOLERANCE, 0)} absolute difference`}
            action={
              <StatusBadge tone={eoddsGap <= TOLERANCE ? "good" : "critical"}>
                Equalized-odds gap {pct(eoddsGap)}
              </StatusBadge>
            }
          />
          <Table>
            <thead>
              <tr>
                <Th>Metric</Th>
                <Th className="text-right">Group A</Th>
                <Th className="text-right">Group B</Th>
                <Th className="text-right">Δ (A − B)</Th>
                <Th className="text-right">Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const a = ga[r.key] as number;
                const b = gb[r.key] as number;
                const diff = a - b;
                const ok = Math.abs(diff) <= TOLERANCE;
                return (
                  <Tr key={r.metric}>
                    <Td>
                      <div className="font-medium text-fg">{r.metric}</div>
                      <div className="text-[11px] text-muted">{r.def}</div>
                    </Td>
                    <Td className="text-right font-mono tabular">{pct(a)}</Td>
                    <Td className="text-right font-mono tabular">{pct(b)}</Td>
                    <Td className="text-right font-mono tabular text-fg">{diff >= 0 ? "+" : ""}{(diff * 100).toFixed(1)} pp</Td>
                    <Td className="text-right">
                      <StatusBadge tone={ok ? "good" : "critical"}>{ok ? "Within tol." : "Violated"}</StatusBadge>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
          <p className="border-t border-line px-4 py-2.5 text-[11px] text-muted">
            Impossibility result (Kleinberg et al.; Chouldechova): when base rates differ ({pct(data.filter((d) => d.group === "Group A" && d.label).length / ga.n, 0)} vs{" "}
            {pct(data.filter((d) => d.group === "Group B" && d.label).length / gb.n, 0)}), calibration-type and error-rate parity cannot all hold at once.
          </p>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Rates by group" />
            <CardBody>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={barData} barGap={2}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="metric" {...axisProps} />
                    <YAxis {...axisProps} width={40} domain={[0, 1]} tickFormatter={(v) => `${v * 100}%`} />
                    <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip valueFormatter={(v) => pct(v)} />} />
                    <Bar dataKey="Group A" fill={A} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Group B" fill={B} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Legend items={[{ label: "Group A", color: A }, { label: "Group B", color: B }]} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Score distributions" description="Vertical lines = active thresholds" />
            <CardBody>
              <div className="h-56">
                <ResponsiveContainer>
                  <AreaChart data={hist}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="score" type="number" domain={[0, 1]} {...axisProps} />
                    <YAxis {...axisProps} width={36} />
                    <Tooltip content={<ChartTooltip labelFormatter={(l) => `Score ≈ ${l}`} />} />
                    <Area type="monotone" dataKey="Group A" stroke={A} fill={A} fillOpacity={0.12} strokeWidth={2} />
                    <Area type="monotone" dataKey="Group B" stroke={B} fill={B} fillOpacity={0.12} strokeWidth={2} />
                    <ReferenceLine x={tA} stroke={A} strokeDasharray="4 3" />
                    {perGroup && <ReferenceLine x={tB} stroke={B} strokeDasharray="4 3" />}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <Legend items={[{ label: "Group A", color: A }, { label: "Group B", color: B }]} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ExplainPane() {
  const [applicantId, setApplicantId] = useState(APPLICANTS[0].id);
  const [values, setValues] = useState<Record<string, number>>(APPLICANTS[0].values);

  const z = logit(values);
  const p = sigmoid(z);
  const approved = p >= 0.5;

  const contribs = FEATURES.map((f) => ({ f, c: f.weight * (values[f.key] - f.mean) })).sort(
    (a, b) => Math.abs(b.c) - Math.abs(a.c),
  );

  // Waterfall in log-odds space: base → each contribution → f(x)
  const waterfall = (() => {
    let run = INTERCEPT;
    const rows = [{ name: "Base value E[f(x)]", range: [0, INTERCEPT] as [number, number], value: INTERCEPT, kind: "total" }];
    for (const { f, c } of contribs) {
      rows.push({ name: `${f.label} = ${values[f.key]}`, range: [run, run + c], value: c, kind: c >= 0 ? "pos" : "neg" });
      run += c;
    }
    rows.push({ name: "Model output f(x)", range: [0, run], value: run, kind: "total" });
    return rows;
  })();

  const counterfactuals = FEATURES.filter((f) => f.actionable)
    .map((f) => {
      const needed = values[f.key] + (0.0001 - z) / f.weight; // value that brings logit to 0 (p = 0.5)
      const rounded = f.weight > 0 ? Math.ceil(needed / f.step) * f.step : Math.floor(needed / f.step) * f.step;
      return { f, target: +rounded.toFixed(2), feasible: rounded >= f.min && rounded <= f.max };
    })
    .filter((c) => c.feasible)
    .sort((a, b) => Math.abs(a.target - values[a.f.key]) / (a.f.max - a.f.min) - Math.abs(b.target - values[b.f.key]) / (b.f.max - b.f.min));

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
      <Card className="h-fit">
        <CardHeader
          title="Local instance"
          action={
            <Select
              aria-label="Applicant"
              value={applicantId}
              onChange={(e) => {
                setApplicantId(e.target.value);
                setValues(APPLICANTS.find((a) => a.id === e.target.value)!.values);
              }}
              options={APPLICANTS.map((a) => ({ value: a.id, label: a.id }))}
            />
          }
        />
        <CardBody className="space-y-4">
          {FEATURES.map((f) => (
            <Slider
              key={f.key}
              label={`${f.label} (${f.unit})`}
              valueLabel={String(values[f.key])}
              value={[values[f.key]]}
              min={f.min}
              max={f.max}
              step={f.step}
              onValueChange={([n]) => setValues((v) => ({ ...v, [f.key]: n }))}
            />
          ))}
        </CardBody>
      </Card>

      <div className="min-w-0 space-y-4">
        <Card>
          <CardHeader
            title="Feature attribution waterfall"
            description="Additive contributions in log-odds (exact SHAP values for a linear model with independent features)"
            action={<StatusBadge tone={approved ? "good" : "critical"}>{approved ? "Approved" : "Declined"} · p = {p.toFixed(3)}</StatusBadge>}
          />
          <CardBody>
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={waterfall} layout="vertical" margin={{ left: 8, right: 48 }}>
                  <CartesianGrid {...gridProps} vertical horizontal={false} />
                  <XAxis type="number" {...axisProps} domain={["auto", "auto"]} tickFormatter={(v) => v.toFixed(1)} />
                  <YAxis type="category" dataKey="name" width={190} {...axisProps} tick={{ fill: "var(--fg-2)", fontSize: 11 }} />
                  <ReferenceLine x={0} stroke="var(--fg-2)" label={{ value: "p = 0.5", position: "top", fill: "var(--fg-2)", fontSize: 10 }} />
                  <Tooltip
                    cursor={{ fill: "var(--surface-2)" }}
                    content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div className="rounded-md border border-line bg-surface px-2.5 py-2 text-xs shadow-lg">
                          <div className="font-medium text-fg">{payload[0].payload.name}</div>
                          <div className="mt-1 font-mono text-fg-2">
                            {payload[0].payload.kind === "total" ? "" : payload[0].payload.value >= 0 ? "+" : ""}
                            {payload[0].payload.value.toFixed(3)} log-odds
                          </div>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="range" barSize={16} radius={3}>
                    {waterfall.map((d) => (
                      <Cell
                        key={d.name}
                        fill={d.kind === "total" ? "var(--axis)" : d.kind === "pos" ? "var(--series-1)" : "var(--series-8)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Legend
              items={[
                { label: "Pushes toward approval", color: "var(--series-1)" },
                { label: "Pushes toward decline", color: "var(--series-8)" },
                { label: "Base / output", color: "var(--axis)" },
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Counterfactual explanations"
            description={approved ? "Smallest single change that would flip the decision to declined" : "Smallest single actionable change that would flip the decision to approved"}
          />
          {counterfactuals.length === 0 ? (
            <CardBody className="text-xs text-muted">No single actionable feature can flip this decision within its valid range.</CardBody>
          ) : (
            <ul className="divide-y divide-line">
              {counterfactuals.slice(0, 4).map(({ f, target }) => (
                <li key={f.key} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-xs">
                  <span className="w-44 text-fg">{f.label}</span>
                  <span className="font-mono tabular text-fg-2">{values[f.key]}</span>
                  <ArrowRight className="size-3.5 text-muted" />
                  <span className="font-mono font-medium tabular text-fg">
                    {target} {f.unit}
                  </span>
                  <Badge>{f.weight > 0 ? "increase" : "decrease"}</Badge>
                  <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setValues((v) => ({ ...v, [f.key]: target }))}>
                    Apply
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-line px-4 py-2.5 text-[11px] text-muted">
            Immutable or non-actionable features (credit history length, employment tenure) are excluded so recourse is realistic.
          </p>
        </Card>
      </div>
    </div>
  );
}
