import type { Metadata } from "next";
import { FairnessView } from "./view";

export const metadata: Metadata = { title: "Fairness Metrics & Explainability" };

export default function Page() {
  return <FairnessView />;
}
