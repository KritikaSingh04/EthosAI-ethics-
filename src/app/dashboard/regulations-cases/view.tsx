"use client";

import { useMemo, useState } from "react";
import { BookOpen, Download, ListChecks, Search, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge, StatusBadge, type Tone } from "@/components/ui/badge";
import { Meter } from "@/components/ui/meter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import {
  CASES,
  CONTROLS,
  FRAMEWORKS,
  TIERS,
  type ControlStatus,
  type Framework,
  type RiskTier,
} from "@/lib/mock/regulations";
import { cn, downloadText } from "@/lib/utils";

const tierTone: Record<RiskTier, Tone> = { Unacceptable: "critical", High: "serious", Limited: "warning", Minimal: "good" };

export function RegulationsView() {
  return (
    <>
      <PageHeader
        exp={8}
        co="CO4"
        title="AI Regulatory Knowledge Base & Case Library"
        description="Real-world AI incidents classified by EU AI Act risk tier, and a control checklist cross-referencing the EU AI Act, NIST AI RMF, ISO/IEC 42001, UNESCO, OECD and India's DPDP Act."
      />
      <Tabs defaultValue="cases">
        <TabsList className="mb-4">
          <TabsTrigger value="cases">
            <BookOpen /> Case library
          </TabsTrigger>
          <TabsTrigger value="checklist">
            <ListChecks /> Policy checklist
          </TabsTrigger>
        </TabsList>
        <TabsContent value="cases">
          <CaseLibrary />
        </TabsContent>
        <TabsContent value="checklist">
          <PolicyChecklist />
        </TabsContent>
      </Tabs>
    </>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-56 flex-1">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded-md border border-line bg-surface pl-8 pr-8 text-xs text-fg outline-none placeholder:text-muted focus:ring-4 focus:ring-accent/20"
      />
      {value && (
        <button onClick={() => onChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-fg" aria-label="Clear search">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function CaseLibrary() {
  const [tier, setTier] = useState<RiskTier | "all">("all");
  const [sector, setSector] = useState("all");
  const [q, setQ] = useState("");
  const sectors = [...new Set(CASES.map((c) => c.sector))].sort();

  const filtered = CASES.filter((c) => {
    if (tier !== "all" && c.tier !== tier) return false;
    if (sector !== "all" && c.sector !== sector) return false;
    const t = q.trim().toLowerCase();
    return !t || [c.title, c.summary, c.jurisdiction, c.outcome, ...c.principles].join(" ").toLowerCase().includes(t);
  }).sort((a, b) => b.year - a.year);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {TIERS.map((t) => {
          const n = CASES.filter((c) => c.tier === t.tier).length;
          const active = tier === t.tier;
          return (
            <button
              key={t.tier}
              onClick={() => setTier(active ? "all" : t.tier)}
              aria-pressed={active}
              className={cn(
                "rounded-lg border bg-surface p-4 text-left transition-colors",
                active ? "border-fg" : "border-line hover:bg-surface-2/60",
              )}
            >
              <div className="flex items-center justify-between">
                <StatusBadge tone={tierTone[t.tier]}>{t.tier}</StatusBadge>
                <span className="font-mono text-xs text-muted tabular">{n} cases</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-fg-2">{t.summary}</p>
              <p className="mt-1 font-mono text-[10px] text-muted">{t.ref}</p>
            </button>
          );
        })}
      </div>

      <div className="my-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search cases, principles, outcomes…" />
        <Select
          aria-label="Sector"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          options={[{ value: "all", label: "All sectors" }, ...sectors.map((s) => ({ value: s, label: s }))]}
          className="w-48"
        />
        {(tier !== "all" || sector !== "all" || q) && (
          <Button variant="ghost" size="sm" onClick={() => { setTier("all"); setSector("all"); setQ(""); }}>
            Clear filters
          </Button>
        )}
        <span className="ml-auto text-xs text-muted">{filtered.length} of {CASES.length}</span>
      </div>

      {filtered.length === 0 ? (
        <Card className="py-16 text-center text-xs text-muted">No cases match these filters.</Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <StatusBadge tone={tierTone[c.tier]}>{c.tier}</StatusBadge>
                <span className="font-mono text-[11px] text-muted">{c.year} · {c.jurisdiction}</span>
              </div>
              <h3 className="mt-2.5 text-[13px] font-semibold text-fg">{c.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-fg-2">{c.summary}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                <Badge tone="accent">{c.sector}</Badge>
                {c.principles.map((p) => <Badge key={p}>{p}</Badge>)}
              </div>
              <p className="mt-auto border-t border-line pt-2.5 text-[11px] leading-relaxed text-muted">
                <span className="font-medium text-fg-2">Outcome · </span>
                {c.outcome}
              </p>
            </Card>
          ))}
        </div>
      )}
      <p className="mt-4 text-[11px] text-muted">
        Tier assignments are illustrative teaching classifications under the EU AI Act (Regulation (EU) 2024/1689); many cases predate the Act.
      </p>
    </>
  );
}

const STATUS_META: Record<ControlStatus, { label: string; tone: Tone }> = {
  met: { label: "Met", tone: "good" },
  partial: { label: "Partial", tone: "warning" },
  gap: { label: "Gap", tone: "critical" },
  na: { label: "N/A", tone: "neutral" },
};

function PolicyChecklist() {
  const [status, setStatus] = useState<Record<string, ControlStatus>>(() => Object.fromEntries(CONTROLS.map((c) => [c.id, c.defaultStatus])));
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [statusFilter, setStatusFilter] = useState<ControlStatus | "all">("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () =>
      CONTROLS.filter((c) => {
        if (frameworks.length && !frameworks.some((f) => c.refs[f])) return false;
        if (statusFilter !== "all" && status[c.id] !== statusFilter) return false;
        const t = q.trim().toLowerCase();
        return !t || [c.id, c.control, c.category, ...Object.values(c.refs)].join(" ").toLowerCase().includes(t);
      }),
    [frameworks, statusFilter, q, status],
  );

  const applicable = CONTROLS.filter((c) => status[c.id] !== "na");
  const coverage = applicable.reduce((s, c) => s + (status[c.id] === "met" ? 1 : status[c.id] === "partial" ? 0.5 : 0), 0) / (applicable.length || 1);
  const count = (s: ControlStatus) => CONTROLS.filter((c) => status[c.id] === s).length;

  const exportCsv = () => {
    const header = ["ID", "Control", "Category", "Status", ...FRAMEWORKS];
    const rows = CONTROLS.map((c) => [c.id, `"${c.control}"`, c.category, STATUS_META[status[c.id]].label, ...FRAMEWORKS.map((f) => `"${c.refs[f] ?? ""}"`)]);
    downloadText("ai-governance-checklist.csv", [header.join(","), ...rows.map((r) => r.join(","))].join("\n"), "text/csv");
  };

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.4fr_repeat(4,1fr)]">
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Weighted coverage</span>
            <span className="font-mono text-fg tabular">{Math.round(coverage * 100)}%</span>
          </div>
          <Meter className="mt-2.5" value={coverage} threshold={0.8} color="var(--accent)" />
          <p className="mt-2 text-[11px] text-muted">Met = 1, Partial = 0.5 · target 80%</p>
        </Card>
        {(["met", "partial", "gap", "na"] as ControlStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
            aria-pressed={statusFilter === s}
            className={cn("rounded-lg border bg-surface p-4 text-left", statusFilter === s ? "border-fg" : "border-line hover:bg-surface-2/60")}
          >
            <StatusBadge tone={STATUS_META[s].tone}>{STATUS_META[s].label}</StatusBadge>
            <div className="mt-2 text-2xl font-semibold tracking-tight">{count(s)}</div>
          </button>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <SearchInput value={q} onChange={setQ} placeholder="Search controls, articles, clauses…" />
          <div className="flex flex-wrap gap-1">
            {FRAMEWORKS.map((f) => {
              const on = frameworks.includes(f);
              return (
                <button
                  key={f}
                  onClick={() => setFrameworks(on ? frameworks.filter((x) => x !== f) : [...frameworks, f])}
                  aria-pressed={on}
                  className={cn("h-7 rounded-md border px-2 text-[11px]", on ? "border-fg bg-fg text-bg" : "border-line text-fg-2 hover:bg-surface-2")}
                >
                  {f}
                </button>
              );
            })}
          </div>
          <Button size="sm" className="ml-auto" onClick={exportCsv}>
            <Download /> CSV
          </Button>
        </div>
        <Table>
          <thead>
            <tr>
              <Th className="w-16">ID</Th>
              <Th>Control</Th>
              <Th>Cross-references</Th>
              <Th className="w-56">Status</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <Tr key={c.id} className="align-top">
                <Td className="py-2.5 font-mono text-muted">{c.id}</Td>
                <Td className="py-2.5">
                  <div className="text-fg">{c.control}</div>
                  <div className="mt-0.5 text-[11px] text-muted">{c.category}</div>
                </Td>
                <Td className="py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {(Object.entries(c.refs) as [Framework, string][]).map(([f, ref]) => (
                      <Badge key={f} tone={frameworks.includes(f) ? "accent" : "neutral"} className="font-normal">
                        <span className="font-medium">{f}</span> {ref}
                      </Badge>
                    ))}
                  </div>
                </Td>
                <Td className="py-2.5">
                  <div className="inline-flex rounded-md border border-line p-0.5" role="radiogroup" aria-label={`Status for ${c.id}`}>
                    {(Object.keys(STATUS_META) as ControlStatus[]).map((s) => (
                      <button
                        key={s}
                        role="radio"
                        aria-checked={status[c.id] === s}
                        onClick={() => setStatus((st) => ({ ...st, [c.id]: s }))}
                        className={cn(
                          "h-6 rounded px-2 text-[11px]",
                          status[c.id] === s ? "bg-surface-2 font-medium text-fg shadow-[0_0_0_1px_var(--ring)]" : "text-muted hover:text-fg",
                        )}
                      >
                        {STATUS_META[s].label}
                      </button>
                    ))}
                  </div>
                </Td>
              </Tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-xs text-muted">No controls match these filters.</td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
