"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { ALL_NAV } from "./nav";

const STORAGE_KEY = "ethosai.sidebar.collapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate persisted preference after mount
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {}
  }, []);

  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(STORAGE_KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-dvh">
      <Sidebar collapsed={collapsed} onToggle={toggle} />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <nav className="absolute inset-y-0 left-0 w-64 overflow-y-auto border-r border-line bg-surface p-2">
            <div className="flex h-10 items-center justify-between px-2">
              <span className="text-sm font-semibold">EthosAI</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="text-muted">
                <X className="size-4" />
              </button>
            </div>
            {ALL_NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex h-9 items-center gap-2.5 rounded-md px-2 text-sm",
                  pathname === n.href ? "bg-surface-2 font-medium text-fg" : "text-fg-2",
                )}
              >
                <n.icon className="size-4 text-muted" />
                {n.short}
              </Link>
            ))}
          </nav>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
