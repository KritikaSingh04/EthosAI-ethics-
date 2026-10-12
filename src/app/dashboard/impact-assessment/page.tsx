import type { Metadata } from "next";
import { ImpactAssessmentView } from "./view";

export const metadata: Metadata = { title: "Algorithmic Impact Assessment" };

export default function Page() {
  return <ImpactAssessmentView />;
}
