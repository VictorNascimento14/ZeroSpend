import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Assinaturas" };

export default function SubscriptionsPage() {
  return <PageHeader title="Assinaturas" description="Todas as assinaturas de software da empresa." />;
}
