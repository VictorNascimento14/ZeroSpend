import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatementImport } from "@/components/onboarding/statement-import";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Traga suas assinaturas" };

export default function OnboardingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Traga suas assinaturas"
        description="Suba o extrato do cartão da empresa: o ZeroSpend encontra os softwares e você confirma o que entra."
        actions={
          // O contornado tem o fundo da página: sobre ela, só o fundo do card o destaca.
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "bg-card")}>
            Ir para o dashboard
          </Link>
        }
      />
      <div className="max-w-3xl">
        <StatementImport />
      </div>
    </div>
  );
}
