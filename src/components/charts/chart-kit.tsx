"use client";

import type { TooltipContentProps } from "recharts";
import { cn } from "@/lib/utils";

/** Categorical slots in fixed, CVD-validated order. Never cycle past these. */
export const SERIES = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
  "var(--series-7)",
  "var(--series-8)",
] as const;

export const axisProps = {
  stroke: "var(--axis)",
  tick: { fill: "var(--axis)", fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: "var(--line-strong)" },
} as const;

export const gridProps = {
  stroke: "var(--grid)",
  strokeDasharray: "0",
  vertical: false,
} as const;

type Fmt = (v: number) => string;

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = (v) => String(v),
  labelFormatter,
}: Partial<TooltipContentProps<number, string>> & {
  valueFormatter?: Fmt;
  labelFormatter?: (l: string | number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-36 rounded-md border border-line bg-surface px-2.5 py-2 text-xs shadow-lg">
      {label !== undefined && (
        <div className="mb-1.5 font-medium text-fg">
          {labelFormatter ? labelFormatter(label as string) : label}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={String(p.dataKey)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-fg-2">
              <span className="size-2 rounded-sm" style={{ background: p.color ?? p.payload?.fill }} />
              {p.name}
            </span>
            <span className="tabular font-mono text-fg">
              {typeof p.value === "number" ? valueFormatter(p.value) : String(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Legend({
  items,
  className,
}: {
  items: { label: string; color: string; dashed?: boolean }[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-2", className)}>
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          {i.dashed ? (
            <span className="w-3 border-t-2 border-dashed" style={{ borderColor: i.color }} />
          ) : (
            <span className="size-2 rounded-sm" style={{ background: i.color }} />
          )}
          {i.label}
        </li>
      ))}
    </ul>
  );
}
