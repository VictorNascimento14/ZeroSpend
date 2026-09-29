import type { Metadata } from "next";
import { EmailConnectCard } from "@/components/integrations/email-connect-card";
import { SourceSummary } from "@/components/integrations/source-summary";
import { PageHeader } from "@/components/layout/page-header";
import { StatementImport } from "@/components/onboarding/statement-import";

export const metadata: Metadata = { title: "Extratos e integrações" };

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Extratos e integrações"
        description="De onde vêm as assinaturas da empresa: o extrato do cartão, o e-mail e o cadastro manual."
      />
      <SourceSummary />
      {/* O card do e-mail fica ao lado só quando o extrato ainda tem espaço para a revisão (~700px). */}
      <div className="grid items-start gap-6 min-[1400px]:grid-cols-[minmax(0,1fr)_26rem]">
        <StatementImport />
        <EmailConnectCard />
      </div>
    </div>
  );
}
