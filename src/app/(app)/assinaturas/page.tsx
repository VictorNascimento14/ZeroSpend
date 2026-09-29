import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { NewSubscriptionButton } from "@/components/subscriptions/new-subscription-button";

export const metadata: Metadata = { title: "Assinaturas" };

export default function SubscriptionsPage() {
  return (
    <PageHeader
      title="Assinaturas"
      description="Todas as assinaturas de software da empresa."
      actions={<NewSubscriptionButton />}
    />
  );
}
