import {
  ClipboardCheck,
  Crosshair,
  Database,
  HeartPulse,
  LayoutDashboard,
  Library,
  ScanFace,
  ShieldCheck,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  short: string;
  exp?: number;
  co?: string;
  icon: LucideIcon;
};

export const OVERVIEW: NavItem = {
  href: "/dashboard",
  label: "Overview",
  short: "Overview",
  icon: LayoutDashboard,
};

// Order and CO mapping follow the Ethics for AI & DS Lab experiment list (Odd 2026-27).
export const MODULES: NavItem[] = [
  { href: "/dashboard/ethical-analysis", label: "Ethical Principles & Risk Scoring", short: "Ethical Analysis", exp: 1, co: "CO1", icon: ShieldCheck },
  { href: "/dashboard/dataset-bias", label: "Dataset Bias & Disparate Impact", short: "Dataset Bias", exp: 2, co: "CO2", icon: Database },
  { href: "/dashboard/deepfake-vulnerability", label: "Synthetic Media & Provenance", short: "Deepfake Audit", exp: 3, co: "CO2", icon: ScanFace },
  { href: "/dashboard/cost-as-proxy", label: "Cost-as-a-Proxy Resource Bias", short: "Cost-as-Proxy", exp: 4, co: "CO3", icon: HeartPulse },
  { href: "/dashboard/fairness-explainability", label: "Fairness & Explainability", short: "Fairness & XAI", exp: 5, co: "CO2", icon: SlidersHorizontal },
  { href: "/dashboard/impact-assessment", label: "Algorithmic Impact Assessment", short: "Impact Assessment", exp: 6, co: "CO3", icon: ClipboardCheck },
  { href: "/dashboard/target-degradation", label: "Target Selection & Drift", short: "Target & Drift", exp: 7, co: "CO4", icon: Crosshair },
  { href: "/dashboard/regulations-cases", label: "Regulations & Case Library", short: "Regulations", exp: 8, co: "CO4", icon: Library },
];

export const ALL_NAV = [OVERVIEW, ...MODULES];

export const findNav = (pathname: string) =>
  ALL_NAV.find((n) => n.href === pathname) ??
  MODULES.find((n) => pathname.startsWith(n.href));
