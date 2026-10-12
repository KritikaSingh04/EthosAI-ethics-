"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandSearch } from "./command-search";
import { ThemeToggle } from "./theme-toggle";
import { findNav } from "./nav";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const current = findNav(pathname);
  const isOverview = pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenu} aria-label="Open navigation">
        <Menu />
      </Button>

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-xs">
        <Link href="/dashboard" className="text-muted hover:text-fg">
          Dashboard
        </Link>
        {!isOverview && current && (
          <>
            <ChevronRight className="size-3 shrink-0 text-muted" />
            {current.exp && <span className="hidden font-mono text-muted sm:inline">Exp {current.exp}</span>}
            {current.exp && <ChevronRight className="hidden size-3 shrink-0 text-muted sm:inline" />}
            <span className="truncate font-medium text-fg">{current.short}</span>
          </>
        )}
      </nav>

      <div className="ml-auto flex flex-1 items-center justify-end gap-2">
        <div className="hidden flex-1 justify-end sm:flex">
          <CommandSearch />
        </div>
        <div
          className="hidden items-center gap-1.5 rounded-md border border-line px-2 py-1 text-[11px] text-fg-2 lg:flex"
          title="All audit engines run locally on mock data"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-good opacity-40" />
            <span className="relative inline-flex size-2 rounded-full bg-good" />
          </span>
          Audit engine · operational
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
