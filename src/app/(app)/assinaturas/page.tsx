import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { NewSubscriptionButton } from "@/components/subscriptions/new-subscription-button";
import { SubscriptionsList } from "@/components/subscriptions/subscriptions-list";

export const metadata: Metadata = { title: "Assinaturas" };

export default async function SubscriptionsPage({ searchParams }: PageProps<"/assinaturas">) {
  const { busca } = await searchParams;
  const initialQuery = typeof busca === "string" ? busca : "";
  return (
    <div className="space-y-6">
      <PageHeader
        title="Assinaturas"
        description="Todas as assinaturas de software da empresa."
        actions={<NewSubscriptionButton />}
      />
      {/* A chave recria a lista quando a busca global troca o ?busca= sem sair da página. */}
      <SubscriptionsList key={initialQuery} initialQuery={initialQuery} />
    </div>
  );
}
