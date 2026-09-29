import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Extratos e integrações" };

export default function IntegrationsPage() {
  return <PageHeader title="Extratos e integrações" description="Importe o extrato do cartão para encontrar as assinaturas." />;
}
