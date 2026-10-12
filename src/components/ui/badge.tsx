import { cva, type VariantProps } from "class-variance-authority";
import { CircleCheck, CircleX, Info, TriangleAlert, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none",
  {
    variants: {
      tone: {
        neutral: "border-line bg-surface-2 text-fg-2",
        accent: "border-accent/30 bg-accent/10 text-accent",
        good: "border-good/30 bg-good/10 text-good-text",
        warning: "border-warning/40 bg-warning/15 text-warning-text",
        serious: "border-serious/40 bg-serious/15 text-serious-text",
        critical: "border-critical/30 bg-critical/10 text-critical-text",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type Tone = NonNullable<VariantProps<typeof badge>["tone"]>;

export function Badge({
  tone,
  className,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badge>) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}

const statusIcon = {
  good: CircleCheck,
  warning: TriangleAlert,
  serious: OctagonAlert,
  critical: CircleX,
  neutral: Info,
  accent: Info,
} as const;

/** Status never travels on color alone: icon + label + tint. */
export function StatusBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const Icon = statusIcon[tone];
  return (
    <Badge tone={tone}>
      <Icon className="size-3" aria-hidden />
      {children}
    </Badge>
  );
}

export type RiskLevel = "low" | "medium" | "high" | "critical";
export const riskTone: Record<RiskLevel, Tone> = {
  low: "good",
  medium: "warning",
  high: "serious",
  critical: "critical",
};
export function RiskBadge({ level }: { level: RiskLevel }) {
  return <StatusBadge tone={riskTone[level]}>{level[0].toUpperCase() + level.slice(1)} risk</StatusBadge>;
}
