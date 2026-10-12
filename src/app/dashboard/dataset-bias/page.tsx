import type { Metadata } from "next";
import { DatasetBiasView } from "./view";

export const metadata: Metadata = { title: "Dataset Bias & Disparate Impact" };

export default function Page() {
  return <DatasetBiasView />;
}
