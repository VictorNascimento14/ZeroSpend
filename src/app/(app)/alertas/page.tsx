import type { Metadata } from "next";
import { AlertsCenter } from "@/components/alerts/alerts-center";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Alertas" };

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertas"
        description="Renovações dentro da antecedência, ferramentas redundantes e assinaturas em revisão."
      />
      <AlertsCenter />
    </div>
  );
}
