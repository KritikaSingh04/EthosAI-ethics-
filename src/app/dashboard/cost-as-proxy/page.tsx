import type { Metadata } from "next";
import { CostProxyView } from "./view";

export const metadata: Metadata = { title: "Cost-as-a-Proxy Resource Bias Audit" };

export default function Page() {
  return <CostProxyView />;
}
