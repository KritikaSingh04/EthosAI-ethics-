"use client";

import { useMemo, useRef, useState } from "react";
import { Download, FileDown, Upload, UsersRound } from "lucide-react";
import {
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
import { Stat } from "@/components/ui/stat";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Meter } from "@/components/ui/meter";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { ChartTooltip, Legend, axisProps, gridProps } from "@/components/charts/chart-kit";
import {
  MIN_SHARE,
  SAMPLE_DATASETS,
  analyzeBias,
  parseCsv,
  toCsv,
  type Row,
} from "@/lib/mock/datasets";
import { downloadText, pct } from "@/lib/utils";

type Loaded = { id: string; name: string; rows: Row[]; target: string; positive: string; protectedAttrs: string[] };

const distinct = (rows: Row[], col: string) => [...new Set(rows.map((r) => String(r[col])))];

/** Guess target (binary column) and protected attributes (low-cardinality categoricals). */
function inferSchema(rows: Row[]): Pick<Loaded, "target" | "positive" | "protectedAttrs"> {
  const cols = Object.keys(rows[0] ?? {});
  const binary = cols.filter((c) => distinct(rows, c).length === 2);
  const target = binary[binary.length - 1] ?? cols[cols.length - 1];
  const values = distinct(rows, target);
  const positive = values.find((v) => ["1", "yes", "true", "approved", "hired"].includes(v.toLowerCase())) ?? values[0];
  const protectedAttrs = cols.filter((c) => {
    if (c === target || /id$/i.test(c)) return false;
    const n = distinct(rows, c).length;
    return n >= 2 && n <= 12;
  });
  return { target, positive, protectedAttrs };
}

export function DatasetBiasView() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState<Loaded | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [datasetId, setDatasetId] = useState(SAMPLE_DATASETS[0].id);

  const datasets = useMemo<Loaded[]>(() => (uploaded ? [...SAMPLE_DATASETS, uploaded] : SAMPLE_DATASETS), [uploaded]);
  const ds = datasets.find((d) => d.id === datasetId) ?? datasets[0];

  const [attr, setAttr] = useState(ds.protectedAttrs[0]);
  const activeAttr = ds.protectedAttrs.includes(attr) ? attr : ds.protectedAttrs[0];

  const report = useMemo(
    () => analyzeBias(ds.rows, activeAttr, ds.target, ds.positive),
    [ds, activeAttr],
  );

  const allReports = useMemo(
    () => ds.protectedAttrs.map((a) => ({ attr: a, ...analyzeBias(ds.rows, a, ds.target, ds.positive) })),
    [ds],
  );
  const underrep = allReports.flatMap((r) => r.groups.filter((g) => g.underrepresented).map((g) => ({ attr: r.attr, ...g })));

  const onFile = async (file: File) => {
    setUploadError(null);
    try {
      const text = await file.text();
      const rows: Row[] = file.name.endsWith(".json") ? JSON.parse(text) : parseCsv(text);
      if (!Array.isArray(rows) || rows.length < 10) throw new Error("Need at least 10 rows.");
      const schema = inferSchema(rows);
      if (!schema.protectedAttrs.length) throw new Error("No categorical column with 2–12 values to audit.");
      setUploaded({ id: "upload", name: `${file.name} (n=${rows.length.toLocaleString()})`, rows, ...schema });
      setDatasetId("upload");
      setAttr(schema.protectedAttrs[0]);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Could not parse file.");
    }
  };

  const exportReport = () => {
    const lines = [
      `# Dataset bias report — ${ds.name}`,
      "",
      `Target: \`${ds.target}\` (positive = \`${ds.positive}\`) · Rows: ${ds.rows.length}`,
      "",
      ...allReports.flatMap((r) => [
        `## ${r.attr}`,
        "",
        `- Privileged group: **${r.privileged}**`,
        `- Demographic parity difference: **${pct(r.dpd)}**`,
        `- Disparate impact ratio: **${r.dir.toFixed(2)}** — ${r.passesFourFifths ? "passes" : "FAILS"} the four-fifths rule`,
        "",
        "| Group | n | Share | Positive rate | DIR |",
        "|---|---:|---:|---:|---:|",
        ...r.groups.map((g) => `| ${g.group}${g.underrepresented ? " ⚠" : ""} | ${g.n} | ${pct(g.share)} | ${pct(g.rate)} | ${g.dir.toFixed(2)} |`),
        "",
      ]),
    ];
    downloadText(`bias-report-${ds.id}.md`, lines.join("\n"));
  };

  const distData = report.groups.map((g) => ({ group: g.group, Positive: g.positives, Negative: g.negatives }));
  const dirData = report.groups.map((g) => ({ group: g.group, DIR: +g.dir.toFixed(3), pass: g.dir >= 0.8 }));

  return (
    <>
      <PageHeader
        exp={2}
        co="CO2"
        title="Dataset Bias & Disparate Impact Scanner"
        description="Load a sample or upload your own CSV/JSON. The scanner computes per-group outcome rates, demographic parity difference, and the disparate impact ratio against the EEOC four-fifths rule, and flags under-represented groups."
        actions={
          <>
            <Select
              aria-label="Dataset"
              value={ds.id}
              onChange={(e) => setDatasetId(e.target.value)}
              options={datasets.map((d) => ({ value: d.id, label: d.name }))}
              className="w-64"
            />
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
            <Button onClick={() => fileRef.current?.click()}>
              <Upload /> Upload CSV/JSON
            </Button>
            <Button onClick={() => downloadText(`${ds.id}.csv`, toCsv(ds.rows), "text/csv")}>
              <FileDown /> Dataset
            </Button>
            <Button variant="primary" onClick={exportReport}>
              <Download /> Bias report
            </Button>
          </>
        }
      />

      {uploadError && (
        <div className="mb-4">
          <StatusBadge tone="critical">Upload failed: {uploadError}</StatusBadge>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
        <span className="text-xs text-muted">Protected attribute</span>
        <div className="inline-flex flex-wrap gap-1">
          {ds.protectedAttrs.map((a) => {
            const r = allReports.find((x) => x.attr === a)!;
            return (
              <button
                key={a}
                onClick={() => setAttr(a)}
                className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 font-mono text-xs ${a === activeAttr ? "border-fg bg-fg text-bg" : "border-line text-fg-2 hover:bg-surface-2"}`}
              >
                {a}
                <span className={`size-1.5 rounded-full ${r.passesFourFifths ? "bg-good" : "bg-critical"}`} aria-label={r.passesFourFifths ? "passes" : "fails"} />
              </button>
            );
          })}
        </div>
        <span className="ml-auto text-xs text-muted">
          Target <code className="font-mono text-fg">{ds.target}</code> = <code className="font-mono text-fg">{ds.positive}</code>
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Rows analysed" value={ds.rows.length.toLocaleString()} hint={`${report.groups.length} groups in ${activeAttr}`} />
        <Stat
          label="Demographic parity difference"
          value={pct(report.dpd)}
          hint={`max − min positive rate · privileged: ${report.privileged}`}
          badge={<StatusBadge tone={report.dpd > 0.1 ? "serious" : "good"}>{report.dpd > 0.1 ? "> 10 pp" : "≤ 10 pp"}</StatusBadge>}
        />
        <Stat
          label="Disparate impact ratio"
          value={report.dir.toFixed(2)}
          hint="min / max positive rate · threshold 0.80"
          badge={<StatusBadge tone={report.passesFourFifths ? "good" : "critical"}>{report.passesFourFifths ? "Passes 4/5ths" : "Fails 4/5ths"}</StatusBadge>}
        />
        <Stat
          label="Under-represented groups"
          value={underrep.length}
          hint={`Share < ${pct(MIN_SHARE, 0)} across all attributes`}
          badge={underrep.length ? <StatusBadge tone="warning">Flagged</StatusBadge> : <StatusBadge tone="good">None</StatusBadge>}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Class distribution by group" description={`Outcome counts for ${ds.target} within each ${activeAttr} group`} />
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={distData} barCategoryGap="28%">
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="group" {...axisProps} />
                  <YAxis {...axisProps} width={44} />
                  <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip valueFormatter={(v) => v.toLocaleString()} />} />
                  <Bar dataKey="Negative" stackId="a" fill="var(--series-2)" stroke="var(--surface)" strokeWidth={2} />
                  <Bar dataKey="Positive" stackId="a" fill="var(--series-1)" stroke="var(--surface)" strokeWidth={2} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Legend items={[{ label: `Positive (${ds.positive})`, color: "var(--series-1)" }, { label: "Negative", color: "var(--series-2)" }]} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Disparate impact ratio" description={`Each group's positive rate ÷ ${report.privileged}'s rate · dashed line = 0.80`} />
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={dirData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid {...gridProps} vertical horizontal={false} />
                  <XAxis type="number" domain={[0, 1.1]} {...axisProps} tickFormatter={(v) => v.toFixed(1)} />
                  <YAxis type="category" dataKey="group" {...axisProps} width={84} />
                  <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip valueFormatter={(v) => v.toFixed(2)} />} />
                  <ReferenceLine x={0.8} stroke="var(--fg-2)" strokeDasharray="4 3" label={{ value: "0.80", position: "top", fill: "var(--fg-2)", fontSize: 11 }} />
                  <Bar dataKey="DIR" radius={[0, 4, 4, 0]} barSize={18}>
                    {dirData.map((d) => (
                      <Cell key={d.group} fill={d.pass ? "var(--series-1)" : "var(--critical)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Legend items={[{ label: "≥ 0.80 (passes)", color: "var(--series-1)" }, { label: "< 0.80 (adverse impact)", color: "var(--critical)" }]} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title={`Group breakdown · ${activeAttr}`} description="Representation and outcome parity per group" />
          <Table>
            <thead>
              <tr>
                <Th>Group</Th>
                <Th className="text-right">n</Th>
                <Th className="w-48">Share of dataset</Th>
                <Th className="text-right">Positive rate</Th>
                <Th className="text-right">DIR</Th>
                <Th className="text-right">Flags</Th>
              </tr>
            </thead>
            <tbody>
              {report.groups.map((g) => (
                <Tr key={g.group}>
                  <Td className="font-medium text-fg">
                    {g.group}
                    {g.group === report.privileged && <Badge className="ml-2">reference</Badge>}
                  </Td>
                  <Td className="text-right font-mono tabular">{g.n.toLocaleString()}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Meter value={g.share} threshold={MIN_SHARE} color={g.underrepresented ? "var(--warning)" : "var(--series-1)"} />
                      <span className="w-12 text-right font-mono tabular">{pct(g.share)}</span>
                    </div>
                  </Td>
                  <Td className="text-right font-mono tabular">{pct(g.rate)}</Td>
                  <Td className="text-right font-mono tabular">{g.dir.toFixed(2)}</Td>
                  <Td className="text-right">
                    <div className="inline-flex gap-1">
                      {g.underrepresented && <StatusBadge tone="warning">Under-rep.</StatusBadge>}
                      {g.dir < 0.8 && <StatusBadge tone="critical">Adverse</StatusBadge>}
                      {!g.underrepresented && g.dir >= 0.8 && <StatusBadge tone="good">OK</StatusBadge>}
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card>
          <CardHeader title="Under-represented protected groups" description={`Below ${pct(MIN_SHARE, 0)} of rows — metrics are statistically fragile`} />
          {underrep.length === 0 ? (
            <CardBody className="text-xs text-muted">No groups below the representation floor.</CardBody>
          ) : (
            <ul className="divide-y divide-line">
              {underrep.map((g) => (
                <li key={`${g.attr}-${g.group}`} className="flex items-center gap-3 px-4 py-2.5">
                  <UsersRound className="size-4 text-warning-text" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-fg">{g.group}</div>
                    <div className="font-mono text-[11px] text-muted">{g.attr}</div>
                  </div>
                  <span className="font-mono text-xs tabular text-fg-2">
                    {g.n} · {pct(g.share)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Data preview" description={`First 8 of ${ds.rows.length.toLocaleString()} rows`} />
        <Table>
          <thead>
            <tr>
              {Object.keys(ds.rows[0] ?? {}).map((c) => (
                <Th key={c} className="normal-case">
                  <span className="font-mono">{c}</span>
                  {c === ds.target && <Badge tone="accent" className="ml-1.5">target</Badge>}
                  {ds.protectedAttrs.includes(c) && <Badge className="ml-1.5">protected</Badge>}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ds.rows.slice(0, 8).map((r, i) => (
              <Tr key={i}>
                {Object.keys(ds.rows[0]).map((c) => (
                  <Td key={c} className="font-mono tabular">{String(r[c])}</Td>
                ))}
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
