import { cn } from "@/lib/utils";

/** Horizontal meter with optional threshold tick. value/threshold in [0,1]. */
export function Meter({
  value,
  threshold,
  color = "var(--accent)",
  className,
}: {
  value: number;
  threshold?: number;
  color?: string;
  className?: string;
}) {
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className={cn("relative h-1.5 w-full rounded-full bg-surface-2", className)}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }}
      />
      {threshold !== undefined && (
        <div
          className="absolute -top-1 h-3.5 w-px bg-fg/60"
          style={{ left: `${threshold * 100}%` }}
          aria-hidden
        />
      )}
    </div>
  );
}
