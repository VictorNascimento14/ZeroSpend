import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Alertas" };

export default function AlertsPage() {
  return <PageHeader title="Alertas" description="Renovações próximas, ferramentas redundantes e itens em revisão." />;
}
