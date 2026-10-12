"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Scale } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import { MODULES, OVERVIEW, type NavItem } from "./nav";

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200 md:flex",
        collapsed ? "w-14" : "w-60",
      )}
    >
      <div className={cn("flex h-12 items-center border-b border-line", collapsed ? "justify-center" : "gap-2 px-4")}>
        <div className="flex size-6 items-center justify-center rounded-md bg-fg text-bg">
          <Scale className="size-3.5" />
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <div className="text-[13px] font-semibold tracking-tight">EthosAI</div>
            <div className="truncate text-[10px] text-muted">Ethics & Algorithmic Auditing</div>
          </div>
        )}
      </div>

      <Tooltip.Provider delayDuration={100}>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <NavLink item={OVERVIEW} collapsed={collapsed} />
          {!collapsed && (
            <div className="mb-1 mt-4 px-2 text-[10px] font-medium uppercase tracking-wider text-muted">
              Lab modules
            </div>
          )}
          {collapsed && <div className="mx-2 my-3 border-t border-line" />}
          <div className="space-y-0.5">
            {MODULES.map((m) => (
              <NavLink key={m.href} item={m} collapsed={collapsed} />
            ))}
          </div>
        </nav>
      </Tooltip.Provider>

      <div className="border-t border-line p-2">
        <button
          onClick={onToggle}
          className={cn(
            "flex h-8 w-full items-center gap-2 rounded-md px-2 text-xs text-muted hover:bg-surface-2 hover:text-fg",
            collapsed && "justify-center",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          {!collapsed && <span>Collapse</span>}
          {!collapsed && <kbd className="ml-auto font-mono text-[10px]">⌘B</kbd>}
        </button>
      </div>
    </aside>
  );
}

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const active = pathname === item.href;
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors",
        active ? "bg-surface-2 font-medium text-fg" : "text-fg-2 hover:bg-surface-2/70 hover:text-fg",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon className={cn("size-4 shrink-0", active ? "text-accent" : "text-muted group-hover:text-fg-2")} />
      {!collapsed && (
        <>
          <span className="truncate">{item.short}</span>
          {item.exp && (
            <span className="ml-auto font-mono text-[10px] text-muted tabular">
              {String(item.exp).padStart(2, "0")}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{link}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="right"
          sideOffset={8}
          className="z-50 rounded-md border border-line bg-surface px-2 py-1 text-xs text-fg shadow-md"
        >
          {item.exp ? `Exp ${item.exp} · ` : ""}
          {item.short}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
