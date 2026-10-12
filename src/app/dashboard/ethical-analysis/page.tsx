import type { Metadata } from "next";
import { EthicalAnalysisView } from "./view";

export const metadata: Metadata = { title: "Ethical Principles & Risk Scoring" };

export default function Page() {
  return <EthicalAnalysisView />;
}
