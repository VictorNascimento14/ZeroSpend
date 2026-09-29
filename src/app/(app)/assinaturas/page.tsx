import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { NewSubscriptionButton } from "@/components/subscriptions/new-subscription-button";
import { SubscriptionsList } from "@/components/subscriptions/subscriptions-list";

export const metadata: Metadata = { title: "Assinaturas" };

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Assinaturas"
        description="Todas as assinaturas de software da empresa."
        actions={<NewSubscriptionButton />}
      />
      <SubscriptionsList />
    </div>
  );
}
