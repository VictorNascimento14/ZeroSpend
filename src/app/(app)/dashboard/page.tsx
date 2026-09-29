import type { Metadata } from "next";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Gasto mensal, economia potencial e as renovações que vêm aí." />
      <KpiCards />
    </div>
  );
}
