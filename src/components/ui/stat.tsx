import { cn } from "@/lib/utils";

export function Stat({
  label,
  value,
  hint,
  badge,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-line bg-surface px-4 py-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted">{label}</span>
        {badge}
      </div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight text-fg">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}
