import { Badge } from "@/components/ui/badge";

export function PageHeader({
  exp,
  co,
  title,
  description,
  actions,
}: {
  exp?: number;
  co?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 max-w-3xl">
        {(exp || co) && (
          <div className="mb-2 flex items-center gap-1.5">
            {exp && <Badge className="font-mono">EXP {String(exp).padStart(2, "0")}</Badge>}
            {co && <Badge tone="accent">{co}</Badge>}
          </div>
        )}
        <h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-fg-2">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
