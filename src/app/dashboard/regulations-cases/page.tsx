import type { Metadata } from "next";
import { RegulationsView } from "./view";

export const metadata: Metadata = { title: "AI Regulations & Case Library" };

export default function Page() {
  return <RegulationsView />;
}
