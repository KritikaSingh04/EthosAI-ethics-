"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Pause, Play, Power, RotateCcw, ShieldAlert } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
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
import { StatusBadge, type Tone } from "@/components/ui/badge";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { ChartTooltip, Legend, axisProps, gridProps } from "@/components/charts/chart-kit";
import {
  CANDIDATES,
  PSI_ALERT,
  PSI_HALT,
  generateBatches,
  type TargetClass,
} from "@/lib/mock/drift";
import { mulberry32 } from "@/lib/rng";
import { cn, downloadJson, pct } from "@/lib/utils";

const ACC_SLA = 0.9;
const TICK_MS = 900;
const DECISIONS_PER_BATCH = 4;

type EngineState = "running" | "paused" | "halted" | "killed";
type Verdict = "executed" | "referred" | "blocked" | "pending" | "approved" | "rejected";

type LoggedDecision = {
  id: number;
  t: string;
  batch: number;
  candidate: string;
  truth: TargetClass;
  predicted: TargetClass;
  confidence: number;
  verdict: Verdict;
  reason: string;
};

const verdictTone: Record<Verdict, Tone> = {
  executed: "accent",
  approved: "accent",
  referred: "warning",
  pending: "warning",
  blocked: "good",
  rejected: "good",
};

const stateTone: Record<EngineState, Tone> = { running: "good", paused: "neutral", halted: "serious", killed: "critical" };

export function TargetDegradationView() {
  const [onset, setOnset] = useState(18);
  const [severity, setSeverity] = useState(1);
  const batches = useMemo(() => generateBatches(48, onset, severity), [onset, severity]);

  // Fail-safe policy
  const [confFloor, setConfFloor] = useState(0.75);
  const [hitl, setHitl] = useState(false);
  const [breaker, setBreaker] = useState(true);

  // Engine
  const [state, setState] = useState<EngineState>("paused");
  const [tick, setTick] = useState(0);
  const [log, setLog] = useState<LoggedDecision[]>([]);
  const [haltReason, setHaltReason] = useState<string | null>(null);
  const [ack, setAck] = useState(false);
  const rand = useRef(mulberry32(1337));

  const batchIdx = Math.min(batches.length - 1, Math.floor(tick / DECISIONS_PER_BATCH));
  const current = batches[batchIdx];

  useEffect(() => {
    if (state !== "running") return;
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, [state]);

  // One decision per tick, evaluated against the live fail-safe policy.
  useEffect(() => {
    if (tick === 0 || state !== "running") return;
    const r = rand.current;
    const b = current;

    if (breaker && b.psi > PSI_HALT) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- circuit breaker reacts to the simulated stream
      setState("halted");
      setHaltReason(`Circuit breaker: PSI ${b.psi.toFixed(2)} > ${PSI_HALT} at ${b.label}`);
      setAck(false);
      return;
    }
    if (batchIdx === batches.length - 1 && tick % DECISIONS_PER_BATCH === DECISIONS_PER_BATCH - 1) setState("paused");

    const u = r();
    const truth: TargetClass = u < 0.6 ? "Authorized" : u < 0.85 ? "Protected" : "Ambiguous";
    const errP = 1 - b.accuracy + b.misalignment * 0.25;
    let predicted = truth;
    if (r() < errP) predicted = truth === "Protected" ? (r() < 0.7 ? "Authorized" : "Ambiguous") : truth === "Authorized" ? "Ambiguous" : "Authorized";
    const confidence = Math.min(0.99, Math.max(0.3, 0.93 - b.psi * 0.9 + (r() - 0.5) * 0.16));

    let verdict: Verdict = "executed";
    let reason = "All guards passed";
    if (predicted === "Protected") [verdict, reason] = ["blocked", "Protected object — action prohibited"];
    else if (predicted === "Ambiguous") [verdict, reason] = ["referred", "Ambiguous classification"];
    else if (confidence < confFloor) [verdict, reason] = ["referred", `Confidence ${confidence.toFixed(2)} < floor ${confFloor.toFixed(2)}`];
    else if (hitl) [verdict, reason] = ["pending", "Awaiting human authorisation"];

    const secs = tick * 2;
    setLog((l) =>
      [
        {
          id: tick,
          t: `T+${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`,
          batch: b.batch,
          candidate: CANDIDATES[Math.floor(r() * CANDIDATES.length)],
          truth,
          predicted,
          confidence,
          verdict,
          reason,
        },
        ...l,
      ].slice(0, 200),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const resolve = (id: number, approve: boolean) =>
    setLog((l) => l.map((d) => (d.id === id ? { ...d, verdict: approve ? "approved" : "rejected", reason: approve ? "Human authorised" : "Human rejected" } : d)));

  const reset = () => {
    setState("paused");
    setTick(0);
    setLog([]);
    setHaltReason(null);
    setAck(false);
    rand.current = mulberry32(1337);
  };

  const counts = log.reduce(
    (acc, d) => {
      const acted = d.verdict === "executed" || d.verdict === "approved";
      if (acted) acc.acted++;
      if (acted && d.truth === "Protected") acc.unsafe++;
      if (d.verdict === "referred" || d.verdict === "pending") acc.referred++;
      if (d.verdict === "blocked" || d.verdict === "rejected") acc.blocked++;
      return acc;
    },
    { acted: 0, unsafe: 0, referred: 0, blocked: 0 },
  );
  const pending = log.filter((d) => d.verdict === "pending");
  const firstBreach = batches.find((b) => b.accuracy < ACC_SLA || b.psi > PSI_ALERT);

  return (
    <>
      <PageHeader
        exp={7}
        co="CO4"
        title="Autonomous Target Selection & Drift Degradation"
        description="Audit how an autonomous selection engine degrades under concept drift and proxy-objective misalignment, and test whether fail-safes — confidence floors, circuit breakers, and meaningful human control — keep protected objects out of harm's way."
        actions={
          <Button variant="primary" onClick={() => downloadJson("degradation-audit.json", { onset, severity, policy: { confFloor, hitl, breaker }, haltReason, counts, decisions: log })}>
            <Download /> Export audit log
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Current batch" value={current.label} hint={`Accuracy ${pct(current.accuracy)} · PSI ${current.psi.toFixed(2)}`} badge={<StatusBadge tone={stateTone[state]}>{state[0].toUpperCase() + state.slice(1)}</StatusBadge>} />
        <Stat label="Actions taken" value={counts.acted} hint={`${counts.referred} referred · ${counts.blocked} blocked`} />
        <Stat
          label="Unsafe actions (protected objects)"
          value={counts.unsafe}
          hint="Executed where ground truth was Protected"
          badge={<StatusBadge tone={counts.unsafe ? "critical" : "good"}>{counts.unsafe ? "Harm" : "None"}</StatusBadge>}
        />
        <Stat label="First SLA breach" value={firstBreach?.label ?? "—"} hint={`Accuracy < ${pct(ACC_SLA, 0)} or PSI > ${PSI_ALERT}`} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Model accuracy over evaluation batches" description={`SLA ${pct(ACC_SLA, 0)} · drift onset ${batches[onset - 1]?.label ?? "—"}`} />
          <CardBody>
            <div className="h-60">
              <ResponsiveContainer>
                <LineChart data={batches} margin={{ right: 8, top: 18 }}>
                  <CartesianGrid {...gridProps} />
                  <ReferenceArea y1={0.7} y2={ACC_SLA} fill="var(--critical)" fillOpacity={0.05} />
                  <XAxis dataKey="batch" {...axisProps} tickFormatter={(b) => `B${b}`} interval={7} />
                  <YAxis {...axisProps} width={44} domain={[0.7, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                  <Tooltip content={<ChartTooltip labelFormatter={(l) => `Batch ${l}`} valueFormatter={(v) => pct(v)} />} />
                  <ReferenceLine y={ACC_SLA} stroke="var(--fg-2)" strokeDasharray="4 3" label={{ value: "SLA", position: "insideTopRight", fill: "var(--fg-2)", fontSize: 10 }} />
                  <ReferenceLine x={onset} stroke="var(--axis)" strokeDasharray="2 3" />
                  {tick > 0 && <ReferenceLine x={current.batch} stroke="var(--fg)" label={{ value: "now", position: "top", fill: "var(--fg)", fontSize: 10 }} />}
                  <Line dataKey="accuracy" name="Accuracy" stroke="var(--series-1)" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Concept drift & target misalignment" description={`PSI alert ${PSI_ALERT} · halt ${PSI_HALT}`} />
          <CardBody>
            <div className="h-60">
              <ResponsiveContainer>
                <LineChart data={batches} margin={{ right: 8, top: 18 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="batch" {...axisProps} tickFormatter={(b) => `B${b}`} interval={7} />
                  <YAxis {...axisProps} width={36} domain={[0, 0.6]} />
                  <Tooltip content={<ChartTooltip labelFormatter={(l) => `Batch ${l}`} valueFormatter={(v) => v.toFixed(3)} />} />
                  <ReferenceLine y={PSI_ALERT} stroke="var(--warning)" strokeDasharray="4 3" />
                  <ReferenceLine y={PSI_HALT} stroke="var(--critical)" strokeDasharray="4 3" label={{ value: "halt", position: "insideTopRight", fill: "var(--critical-text)", fontSize: 10 }} />
                  {tick > 0 && <ReferenceLine x={current.batch} stroke="var(--fg)" />}
                  <Line dataKey="psi" name="Input drift (PSI)" stroke="var(--series-1)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line dataKey="misalignment" name="Proxy–objective misalignment" stroke="var(--series-2)" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <Legend items={[{ label: "Input drift (PSI)", color: "var(--series-1)" }, { label: "Proxy–objective misalignment", color: "var(--series-2)" }]} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Card className={cn(state === "killed" && "border-critical", state === "halted" && "border-serious")}>
            <CardHeader title="Engine control" description="Human-in-the-loop kill switch" action={<StatusBadge tone={stateTone[state]}>{state.toUpperCase()}</StatusBadge>} />
            <CardBody className="space-y-3">
              <div className="flex gap-2">
                {state === "running" ? (
                  <Button className="flex-1" onClick={() => setState("paused")}>
                    <Pause /> Pause
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    disabled={(state === "halted" || state === "killed") && !ack}
                    onClick={() => {
                      setState("running");
                      setHaltReason(null);
                    }}
                  >
                    <Play /> {state === "paused" ? "Run" : "Resume"}
                  </Button>
                )}
                <Button onClick={reset} aria-label="Reset simulation">
                  <RotateCcw />
                </Button>
              </div>
              <Button
                variant="danger"
                className="h-11 w-full text-sm"
                disabled={state === "killed"}
                onClick={() => {
                  setState("killed");
                  setHaltReason("Manual kill switch engaged by operator");
                  setAck(false);
                }}
              >
                <Power /> Emergency stop
              </Button>
              {haltReason && (
                <div className="rounded-md border border-line bg-surface-2 p-3 text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-fg">
                    <ShieldAlert className="size-3.5 text-critical-text" /> {haltReason}
                  </div>
                  <label className="mt-2 flex items-start gap-2 text-fg-2">
                    <input type="checkbox" className="mt-0.5 accent-[var(--accent)]" checked={ack} onChange={(e) => setAck(e.target.checked)} />
                    I have reviewed the drift report and accept responsibility for resuming.
                  </label>
                  {state === "halted" && breaker && (
                    <p className="mt-2 text-[11px] text-muted">The breaker re-trips while PSI stays above {PSI_HALT}; retrain or explicitly override it to continue.</p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Fail-safe policy" />
            <CardBody className="space-y-4">
              <Slider label="Confidence floor" valueLabel={confFloor.toFixed(2)} value={[confFloor]} min={0.5} max={0.95} step={0.01} onValueChange={([n]) => setConfFloor(n)} />
              <label className="flex items-center justify-between gap-3 text-xs text-fg-2">
                Require human authorisation for every action
                <Switch checked={hitl} onCheckedChange={setHitl} />
              </label>
              <label className="flex items-center justify-between gap-3 text-xs text-fg-2">
                Drift circuit breaker (PSI &gt; {PSI_HALT})
                <Switch checked={breaker} onCheckedChange={setBreaker} />
              </label>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Degradation scenario" description="Regenerates evaluation batches" />
            <CardBody className="space-y-4">
              <Slider label="Drift onset batch" valueLabel={`B${onset}`} value={[onset]} min={4} max={40} step={1} onValueChange={([n]) => setOnset(n)} />
              <Slider label="Drift severity" valueLabel={`${severity.toFixed(1)}×`} value={[severity]} min={0.2} max={1.6} step={0.1} onValueChange={([n]) => setSeverity(n)} />
            </CardBody>
          </Card>
        </div>

        <Card className="min-w-0">
          <CardHeader
            title="Decision stream"
            description={pending.length ? `${pending.length} awaiting human authorisation` : "Latest decisions first"}
          />
          {log.length === 0 ? (
            <CardBody className="py-16 text-center text-xs text-muted">Press Run to start the simulated decision engine.</CardBody>
          ) : (
            <div className="max-h-[560px] overflow-y-auto">
              <Table>
                <thead className="sticky top-0 bg-surface">
                  <tr>
                    <Th>Time</Th>
                    <Th>Batch</Th>
                    <Th>Candidate</Th>
                    <Th>Predicted</Th>
                    <Th>Truth</Th>
                    <Th className="text-right">Conf.</Th>
                    <Th>Verdict</Th>
                  </tr>
                </thead>
                <tbody>
                  {log.slice(0, 60).map((d) => {
                    const harm = (d.verdict === "executed" || d.verdict === "approved") && d.truth === "Protected";
                    return (
                      <Tr key={d.id} className={cn(harm && "bg-critical/5")}>
                        <Td className="font-mono tabular text-muted">{d.t}</Td>
                        <Td className="font-mono tabular">B{d.batch}</Td>
                        <Td className="text-fg">{d.candidate}</Td>
                        <Td>{d.predicted}</Td>
                        <Td className={cn(d.truth !== d.predicted && "font-medium text-critical-text")}>{d.truth}</Td>
                        <Td className="text-right font-mono tabular">{d.confidence.toFixed(2)}</Td>
                        <Td>
                          {d.verdict === "pending" ? (
                            <div className="flex gap-1">
                              <Button size="sm" onClick={() => resolve(d.id, true)}>Authorise</Button>
                              <Button size="sm" variant="ghost" onClick={() => resolve(d.id, false)}>Reject</Button>
                            </div>
                          ) : (
                            <span title={d.reason}>
                              <StatusBadge tone={harm ? "critical" : verdictTone[d.verdict]}>{harm ? "Unsafe" : d.verdict}</StatusBadge>
                            </span>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

