# EthosAI — Ethics & Algorithmic Auditing Platform

Interactive dashboard for the **Ethics for AI & Data Science Laboratory** (LY B.Tech AI&DS, Sem VII). Each of the eight experiments is a module under `/dashboard/...`, running on deterministic mock data so every chart renders on first load.

```bash
npm install
npm run dev        # http://localhost:3000 → redirects to /dashboard
```

UI dependencies (already in `package.json`):

```bash
npm install lucide-react recharts clsx tailwind-merge class-variance-authority next-themes \
  @radix-ui/react-tabs @radix-ui/react-slider @radix-ui/react-switch @radix-ui/react-tooltip @radix-ui/react-progress
```

## Modules

| Exp | Route | CO | What's interactive |
|---|---|---|---|
| 1 | `/dashboard/ethical-analysis` | CO1 | App switcher, 8 UNESCO/IEEE pillar sliders, radar vs. baseline, 5×5 likelihood × impact matrix, compliance meter, JSON export |
| 2 | `/dashboard/dataset-bias` | CO2 | Credit/Hiring samples **or your own CSV/JSON** (schema auto-inferred), class distribution, DPD, DIR vs. four-fifths rule, under-representation flags, Markdown report |
| 3 | `/dashboard/deepfake-vulnerability` | CO2 | Media queue, decision threshold, artifact heatmap overlay, detector signals, C2PA manifest checks & edit history, threat matrix |
| 4 | `/dashboard/cost-as-proxy` | CO3 | Obermeyer-style cohort, enrolment percentile, access-gap slider, cost vs. need disparity curves, re-label mitigation with α blend |
| 5 | `/dashboard/fairness-explainability` | CO2 | Live threshold(s), DP / EO / EOdds / predictive parity table, "Equalise opportunity" post-processing, SHAP-style waterfall, counterfactual recourse |
| 6 | `/dashboard/impact-assessment` | CO3 | 5-step UNESCO + IEEE 7000 wizard, live impact tier, report preview, `.md` download, print-to-PDF |
| 7 | `/dashboard/target-degradation` | CO4 | Drift scenario sliders, accuracy / PSI / misalignment charts, live decision stream, confidence floor, HITL approvals, circuit breaker, emergency stop |
| 8 | `/dashboard/regulations-cases` | CO4 | 16 cases filterable by EU AI Act tier / sector / search, 16-control checklist cross-referenced to EU AI Act, NIST AI RMF, ISO/IEC 42001, UNESCO, OECD, DPDP — editable status, CSV export |

Shortcuts: `⌘K` / `Ctrl+K` search modules · `⌘B` / `Ctrl+B` collapse the sidebar.

## Structure

```
src/
├── app/
│   ├── layout.tsx                  # fonts + theme provider
│   ├── page.tsx                    # redirect → /dashboard
│   ├── globals.css                 # design tokens (light/dark), chart palette, print rules
│   └── dashboard/
│       ├── layout.tsx              # AppShell (sidebar + topbar)
│       ├── page.tsx, overview-view.tsx
│       └── <module>/page.tsx + view.tsx   # server page (metadata) + client view
├── components/
│   ├── shell/                      # sidebar, topbar, breadcrumbs, ⌘K search, theme toggle, nav config
│   ├── ui/                         # card, badge, button, tabs, slider, switch, select, meter, stat, table
│   ├── charts/chart-kit.tsx        # palette slots, axis/grid presets, tooltip, legend
│   └── page-header.tsx
└── lib/
    ├── rng.ts                      # seeded PRNG (stable SSR/CSR output)
    ├── utils.ts                    # cn(), download helpers
    └── mock/                       # one data generator per module
```

## Notes

- Mock data comes from a seeded PRNG (`lib/rng.ts`), so it's identical on server and client. Next 16's prerender also forbids `Math.random()` in the static shell.
- Chart colours use a fixed categorical order checked for colour-blind safety. Status colours (good / warning / serious / critical) are reserved for state and always come with an icon and a label.
- Deepfake detector scores and C2PA manifests are simulated, and the page says so. Uploading a file produces a deterministic simulated analysis. Nothing runs a real detection model.
- Case-study tier assignments are illustrative teaching classifications under the EU AI Act.
