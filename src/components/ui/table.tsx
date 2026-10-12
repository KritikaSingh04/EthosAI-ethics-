import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse text-xs", className)} {...props} />
    </div>
  );
}
export function Th({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "h-8 border-b border-line px-3 text-left text-[11px] font-medium uppercase tracking-wide text-muted first:pl-4 last:pr-4",
        className,
      )}
      {...props}
    />
  );
}
export function Td({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      className={cn("h-9 border-b border-line px-3 py-2 text-fg-2 first:pl-4 last:pr-4", className)}
      {...props}
    />
  );
}
export function Tr({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr className={cn("transition-colors hover:bg-surface-2/60", className)} {...props} />;
}
