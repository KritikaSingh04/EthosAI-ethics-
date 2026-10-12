import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Native select styled to match — accessible and zero-JS. */
export function Select({
  options,
  className,
  ...props
}: React.ComponentProps<"select"> & { options: { value: string; label: string }[] }) {
  return (
    <div className={cn("relative inline-flex", className)}>
      <select
        className="h-8 w-full appearance-none rounded-md border border-line bg-surface pl-2.5 pr-7 text-xs text-fg outline-none hover:bg-surface-2 focus-visible:ring-4 focus-visible:ring-accent/25"
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
    </div>
  );
}
