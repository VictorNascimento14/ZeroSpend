import type { Metadata } from "next";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PageHeader } from "@/components/layout/page-header";
import { SubscriptionsTable } from "@/components/subscriptions/subscriptions-table";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Gasto mensal, economia potencial e as renovações que vêm aí." />
      <KpiCards />
      {/*
        O painel fica ao lado da tabela só a partir de 1600px: a tabela pede ~860px, e abaixo disso ela
        seria cortada. Empilhado, o painel vem antes — alerta é o que pede atenção primeiro.
      */}
      <div className="grid items-start gap-6 min-[1600px]:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <SubscriptionsTable />
        </div>
        <AlertsPanel className="order-first min-[1600px]:order-none" />
      </div>
    </div>
  );
}
