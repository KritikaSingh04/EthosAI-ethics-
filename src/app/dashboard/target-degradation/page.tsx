import type { Metadata } from "next";
import { TargetDegradationView } from "./view";

export const metadata: Metadata = { title: "Autonomous Target Selection & Drift" };

export default function Page() {
  return <TargetDegradationView />;
}
