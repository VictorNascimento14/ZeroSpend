import type { Metadata } from "next";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PageHeader } from "@/components/layout/page-header";
import { NewSubscriptionButton } from "@/components/subscriptions/new-subscription-button";
import { SubscriptionsTable } from "@/components/subscriptions/subscriptions-table";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Gasto mensal, economia potencial e as renovações que vêm aí."
        actions={<NewSubscriptionButton />}
      />
      <KpiCards />
      {/*
        O painel fica ao lado da tabela só a partir de 1700px: a tabela pede ~900px (medido), e abaixo
        disso ela seria cortada. Empilhado, o painel vem antes — alerta é o que pede atenção primeiro.
      */}
      <div className="grid items-start gap-6 min-[1700px]:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <SubscriptionsTable />
        </div>
        <AlertsPanel className="order-first min-[1700px]:order-none" />
      </div>
    </div>
  );
}
