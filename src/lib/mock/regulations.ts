export type RiskTier = "Unacceptable" | "High" | "Limited" | "Minimal";

export const TIERS: { tier: RiskTier; summary: string; ref: string }[] = [
  { tier: "Unacceptable", summary: "Prohibited practices — banned outright.", ref: "EU AI Act Art. 5" },
  { tier: "High", summary: "Permitted with conformity assessment, risk management, data governance, logging, human oversight.", ref: "Art. 6 & Annex III" },
  { tier: "Limited", summary: "Transparency obligations — disclose AI interaction and label synthetic content.", ref: "Art. 50" },
  { tier: "Minimal", summary: "No mandatory obligations; voluntary codes of conduct encouraged.", ref: "Art. 95" },
];

export type CaseStudy = {
  id: string;
  title: string;
  year: number;
  jurisdiction: string;
  sector: string;
  tier: RiskTier;
  summary: string;
  principles: string[];
  outcome: string;
};

// Tier = how the system would be classified under the EU AI Act today (illustrative, for teaching).
export const CASES: CaseStudy[] = [
  { id: "compas", title: "COMPAS recidivism scoring", year: 2016, jurisdiction: "USA", sector: "Criminal justice", tier: "High", summary: "ProPublica analysis found Black defendants who did not re-offend were nearly twice as likely as white defendants to be labelled high-risk.", principles: ["Fairness", "Transparency", "Contestability"], outcome: "State v. Loomis upheld use with warnings; sparked the impossibility-of-fairness debate." },
  { id: "amazon", title: "Amazon experimental hiring model", year: 2018, jurisdiction: "USA", sector: "Employment", tier: "High", summary: "Résumé-ranking model trained on a decade of mostly male hires penalised terms such as \"women's\".", principles: ["Fairness", "Data governance"], outcome: "Project discontinued; widely cited example of historical-label bias." },
  { id: "obermeyer", title: "Healthcare cost-as-proxy algorithm", year: 2019, jurisdiction: "USA", sector: "Healthcare", tier: "High", summary: "Care-management algorithm used cost as a proxy for need, under-referring Black patients at equal illness levels.", principles: ["Fairness", "Validity"], outcome: "Vendor collaborated on a re-labelled model; referral disparity reduced substantially in the authors' analysis." },
  { id: "toeslagen", title: "Dutch childcare benefits scandal", year: 2021, jurisdiction: "Netherlands", sector: "Public services", tier: "High", summary: "Risk-classification model used nationality as a factor; thousands of families wrongly flagged for fraud.", principles: ["Non-discrimination", "Accountability", "Human oversight"], outcome: "Government resigned in January 2021; Dutch DPA fined the Tax Administration." },
  { id: "alevels", title: "UK A-level grading algorithm", year: 2020, jurisdiction: "United Kingdom", sector: "Education", tier: "High", summary: "Standardisation model downgraded around 40% of teacher-assessed grades, disproportionately at larger state schools.", principles: ["Fairness", "Contestability", "Transparency"], outcome: "Results withdrawn within days in favour of teacher-assessed grades." },
  { id: "applecard", title: "Apple Card credit limits", year: 2019, jurisdiction: "USA", sector: "Financial services", tier: "High", summary: "Viral reports of women receiving lower limits than spouses with shared finances.", principles: ["Fairness", "Explainability"], outcome: "NY DFS found no unlawful discrimination but criticised transparency and customer service." },
  { id: "robodebt", title: "Robodebt income averaging", year: 2016, jurisdiction: "Australia", sector: "Public services", tier: "High", summary: "Automated debt notices from averaged tax data shifted the burden of proof to welfare recipients.", principles: ["Accountability", "Human oversight", "Legality"], outcome: "Ruled unlawful; A$1.8bn settlement and a Royal Commission (2023)." },
  { id: "uber", title: "Uber ATG pedestrian fatality", year: 2018, jurisdiction: "USA", sector: "Transport", tier: "High", summary: "Self-driving test vehicle failed to classify a pedestrian in time; automatic emergency braking had been disabled.", principles: ["Safety", "Human oversight"], outcome: "NTSB cited inadequate safety culture; backup operator charged." },
  { id: "clearview", title: "Clearview AI face scraping", year: 2020, jurisdiction: "EU / UK / Global", sector: "Biometrics", tier: "Unacceptable", summary: "Untargeted scraping of billions of facial images to build a recognition database sold to law enforcement.", principles: ["Privacy", "Consent", "Proportionality"], outcome: "Fines from Italian, Greek, French and Dutch DPAs; such scraping is now prohibited under Art. 5(1)(e)." },
  { id: "socialscore", title: "General-purpose social scoring", year: 2024, jurisdiction: "EU (prohibition)", sector: "Public sector", tier: "Unacceptable", summary: "Scoring citizens on social behaviour leading to detrimental treatment in unrelated contexts.", principles: ["Human dignity", "Non-discrimination"], outcome: "Explicitly prohibited under Art. 5(1)(c)." },
  { id: "emotion", title: "Workplace emotion recognition", year: 2024, jurisdiction: "EU (prohibition)", sector: "Employment", tier: "Unacceptable", summary: "Inferring employees' emotions from face or voice for monitoring and evaluation.", principles: ["Privacy", "Dignity", "Scientific validity"], outcome: "Prohibited in workplaces and education except for medical or safety reasons (Art. 5(1)(f))." },
  { id: "robocall", title: "Voice-cloned primary robocall", year: 2024, jurisdiction: "USA", sector: "Elections", tier: "Limited", summary: "Synthetic voice of a sitting president urged voters to skip a state primary.", principles: ["Transparency", "Democratic integrity"], outcome: "FCC ruled AI voices in robocalls fall under the TCPA; political consultant fined $6M." },
  { id: "tay", title: "Microsoft Tay chatbot", year: 2016, jurisdiction: "Global", sector: "Consumer", tier: "Limited", summary: "Twitter chatbot learned from coordinated abuse and produced offensive output within 16 hours.", principles: ["Safety", "Robustness"], outcome: "Taken offline within a day; cited in adversarial-input testing practice." },
  { id: "garante", title: "Italian Garante ChatGPT order", year: 2023, jurisdiction: "Italy", sector: "General-purpose AI", tier: "Limited", summary: "Temporary limitation over lawful basis for training data, transparency and age verification.", principles: ["Privacy", "Transparency", "Child safety"], outcome: "Service restored after remediation; €15M fine announced in December 2024." },
  { id: "spam", title: "Email spam filtering", year: 2024, jurisdiction: "Global", sector: "Consumer", tier: "Minimal", summary: "Classifier routing unwanted email — low risk to fundamental rights.", principles: ["Reliability"], outcome: "No mandatory obligations; voluntary codes apply." },
  { id: "games", title: "NPC behaviour in video games", year: 2024, jurisdiction: "Global", sector: "Entertainment", tier: "Minimal", summary: "AI-driven non-player characters and procedural content.", principles: ["Well-being"], outcome: "Minimal risk; voluntary transparency good practice." },
];

export type Framework = "EU AI Act" | "NIST AI RMF" | "ISO/IEC 42001" | "UNESCO" | "OECD" | "India DPDP";
export const FRAMEWORKS: Framework[] = ["EU AI Act", "NIST AI RMF", "ISO/IEC 42001", "UNESCO", "OECD", "India DPDP"];

export type ControlStatus = "met" | "partial" | "gap" | "na";

export type PolicyControl = {
  id: string;
  control: string;
  category: string;
  refs: Partial<Record<Framework, string>>;
  defaultStatus: ControlStatus;
};

export const CONTROLS: PolicyControl[] = [
  { id: "C-01", control: "Documented, continuous risk-management process across the lifecycle", category: "Governance", refs: { "EU AI Act": "Art. 9", "NIST AI RMF": "GOVERN 1 · MANAGE 1", "ISO/IEC 42001": "Cl. 6.1", OECD: "Principle 1.4" }, defaultStatus: "partial" },
  { id: "C-02", control: "Training, validation & test data governance incl. bias examination", category: "Data", refs: { "EU AI Act": "Art. 10", "NIST AI RMF": "MAP 2 · MEASURE 2.11", "ISO/IEC 42001": "Annex A.7", UNESCO: "Data policy (PA 3)" }, defaultStatus: "gap" },
  { id: "C-03", control: "Technical documentation and model cards maintained", category: "Transparency", refs: { "EU AI Act": "Art. 11 · Annex IV", "NIST AI RMF": "MAP 1 · GOVERN 1.4", "ISO/IEC 42001": "Cl. 7.5" }, defaultStatus: "met" },
  { id: "C-04", control: "Automatic event logging for traceability", category: "Accountability", refs: { "EU AI Act": "Art. 12", "NIST AI RMF": "MEASURE 2.8", "ISO/IEC 42001": "Annex A.6" }, defaultStatus: "met" },
  { id: "C-05", control: "Instructions for use & transparency to deployers", category: "Transparency", refs: { "EU AI Act": "Art. 13", "NIST AI RMF": "MAP 1.1", OECD: "Principle 1.3", UNESCO: "Transparency & explainability" }, defaultStatus: "partial" },
  { id: "C-06", control: "Effective human oversight with ability to override or halt", category: "Oversight", refs: { "EU AI Act": "Art. 14", "NIST AI RMF": "MANAGE 2.4", UNESCO: "Human oversight & determination" }, defaultStatus: "partial" },
  { id: "C-07", control: "Accuracy, robustness and cybersecurity testing", category: "Safety", refs: { "EU AI Act": "Art. 15", "NIST AI RMF": "MEASURE 2.5–2.7", "ISO/IEC 42001": "Annex A.6", OECD: "Principle 1.4" }, defaultStatus: "met" },
  { id: "C-08", control: "Fundamental-rights / algorithmic impact assessment before deployment", category: "Impact", refs: { "EU AI Act": "Art. 27", "NIST AI RMF": "MAP 5", "ISO/IEC 42001": "Cl. 6.1.4", UNESCO: "Ethical impact assessment (PA 1)" }, defaultStatus: "gap" },
  { id: "C-09", control: "Disclose AI interaction and label deepfakes / synthetic content", category: "Transparency", refs: { "EU AI Act": "Art. 50", "NIST AI RMF": "GOVERN 6", UNESCO: "Awareness & literacy" }, defaultStatus: "partial" },
  { id: "C-10", control: "Post-market monitoring and serious-incident reporting", category: "Monitoring", refs: { "EU AI Act": "Art. 72–73", "NIST AI RMF": "MANAGE 4", "ISO/IEC 42001": "Cl. 9.1" }, defaultStatus: "gap" },
  { id: "C-11", control: "Lawful, purpose-limited processing with verifiable consent", category: "Privacy", refs: { "India DPDP": "Sec. 4–6", UNESCO: "Privacy & data protection", OECD: "Principle 1.2" }, defaultStatus: "met" },
  { id: "C-12", control: "Data-principal rights: access, correction, erasure, grievance redress", category: "Privacy", refs: { "India DPDP": "Sec. 11–14", "EU AI Act": "Art. 86 (explanation)", OECD: "Principle 1.3" }, defaultStatus: "partial" },
  { id: "C-13", control: "Verifiable parental consent & no behavioural tracking of children", category: "Privacy", refs: { "India DPDP": "Sec. 9", UNESCO: "Gender & vulnerable groups" }, defaultStatus: "na" },
  { id: "C-14", control: "Environmental footprint measured and reported", category: "Sustainability", refs: { UNESCO: "Environment & ecosystems (PA 5)", "ISO/IEC 42001": "Annex C (objectives)", OECD: "Principle 1.1" }, defaultStatus: "gap" },
  { id: "C-15", control: "Named accountable owner and AI governance committee", category: "Governance", refs: { "NIST AI RMF": "GOVERN 2", "ISO/IEC 42001": "Cl. 5.3", OECD: "Principle 1.5", UNESCO: "Responsibility & accountability" }, defaultStatus: "met" },
  { id: "C-16", control: "AI literacy training for staff operating AI systems", category: "Governance", refs: { "EU AI Act": "Art. 4", "NIST AI RMF": "GOVERN 2.2", UNESCO: "Education & research (PA 8)" }, defaultStatus: "partial" },
];
