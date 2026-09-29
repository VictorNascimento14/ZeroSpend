"use client";

import { FileSpreadsheet, Mail, PenLine } from "lucide-react";
import { Kpi } from "@/components/dashboard/kpi-cards";
import { useOrganizationData } from "@/lib/data/store";
import { SOURCE_LABELS } from "@/lib/domain/format";
import type { SubscriptionSource } from "@/lib/domain/types";

const SOURCES = [
  { source: "csv_upload", tone: "cerulean", icon: FileSpreadsheet },
  { source: "email_scan", tone: "plum", icon: Mail },
  { source: "manual", tone: "raspberry", icon: PenLine },
] as const satisfies readonly { source: SubscriptionSource; tone: string; icon: unknown }[];

/**
 * De onde vieram as assinaturas da empresa, contadas a cada leitura (nada disso é gravado). Cancelada
 * não conta, como em todo total do ZeroSpend.
 */
export function SourceSummary() {
  const data = useOrganizationData();
  if (!data) return null;
  const current = data.subscriptions.filter((subscription) => subscription.status !== "cancelled");

  return (
    <section aria-label="Origem das assinaturas" className="grid gap-4 sm:grid-cols-3">
      {SOURCES.map(({ source, tone, icon }) => {
        const fromSource = current.filter((subscription) => subscription.source === source);
        const inReview = fromSource.filter((subscription) => subscription.status === "review_needed").length;
        return (
          <Kpi
            key={source}
            tone={tone}
            icon={icon}
            title={SOURCE_LABELS[source]}
            value={String(fromSource.length)}
            caption={
              fromSource.length === 0 ? "Nenhuma assinatura" : inReview > 0 ? `${inReview} em revisão` : "Todas confirmadas"
            }
          />
        );
      })}
    </section>
  );
}
