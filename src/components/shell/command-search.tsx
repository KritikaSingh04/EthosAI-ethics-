"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_NAV } from "./nav";

/** Top-bar module search. ⌘K / Ctrl+K focuses; ↑↓ + Enter navigates. */
export function CommandSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return ALL_NAV;
    return ALL_NAV.filter((n) =>
      [n.label, n.short, n.co ?? "", n.exp ? `exp ${n.exp}` : ""].join(" ").toLowerCase().includes(term),
    );
  }, [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    router.push(href);
    setQ("");
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setCursor(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setCursor((c) => Math.min(c + 1, results.length - 1));
          else if (e.key === "ArrowUp") setCursor((c) => Math.max(c - 1, 0));
          else if (e.key === "Enter" && results[cursor]) go(results[cursor].href);
          else if (e.key === "Escape") inputRef.current?.blur();
        }}
        placeholder="Search modules, experiments, COs…"
        aria-label="Search modules"
        className="h-8 w-full rounded-md border border-line bg-surface-2/60 pl-8 pr-12 text-xs text-fg outline-none placeholder:text-muted focus:bg-surface focus:ring-4 focus:ring-accent/20"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-line bg-surface px-1 font-mono text-[10px] text-muted">
        ⌘K
      </kbd>
      {open && (
        <ul className="absolute left-0 right-0 top-9 z-40 max-h-80 overflow-y-auto rounded-md border border-line bg-surface p-1 shadow-lg">
          {results.length === 0 && <li className="px-2 py-3 text-xs text-muted">No modules match “{q}”.</li>}
          {results.map((r, i) => (
            <li key={r.href}>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(r.href)}
                onMouseEnter={() => setCursor(i)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left text-xs",
                  i === cursor ? "bg-surface-2 text-fg" : "text-fg-2",
                )}
              >
                <r.icon className="size-3.5 text-muted" />
                <span className="truncate">{r.label}</span>
                {r.exp && <span className="ml-auto font-mono text-[10px] text-muted">EXP {r.exp} · {r.co}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
