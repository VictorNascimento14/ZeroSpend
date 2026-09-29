"use client";

import { BellRing, Layers, PiggyBank, Wallet, type LucideIcon } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganizationData } from "@/lib/data/store";
import { toIsoDate } from "@/lib/domain/dates";
import { formatDaysUntil, formatMoney, plural } from "@/lib/domain/format";
import { computeKpis } from "@/lib/domain/kpis";
import { cn } from "@/lib/utils";

// A cor do ícone de cada card, pelo nome da família do kit, em classes literais (classe montada em
// runtime não gera CSS).
const TONES = {
  cerulean: "bg-cerulean-tint-50 text-cerulean-shade-100 dark:bg-cerulean-shade-300 dark:text-cerulean-tint-200",
  raspberry: "bg-raspberry-tint-50 text-raspberry-shade-100 dark:bg-raspberry-shade-300 dark:text-raspberry-tint-200",
  plum: "bg-plum-tint-50 text-plum-shade-100 dark:bg-plum-shade-300 dark:text-plum-tint-200",
  success: "bg-success-tint-50 text-success-shade-200 dark:bg-success-shade-300 dark:text-success-tint-200",
  warning: "bg-warning-tint-50 text-warning-shade-300 dark:bg-warning-shade-300 dark:text-warning-tint-200",
} as const;

/** Os quatro indicadores do topo do dashboard, da empresa da sessão. */
export function KpiCards() {
  const data = useOrganizationData();
  if (!data) return null;
  const { organization } = data.session;
  const kpis = computeKpis(data.subscriptions, organization, toIsoDate(new Date()));
  const money = (value: number) => formatMoney(value, organization.defaultCurrency);
  const next = kpis.renewals[0];

  return (
    <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        tone="cerulean"
        icon={Wallet}
        title="Gasto mensal"
        value={money(kpis.monthlySpend)}
        caption={
          kpis.convertedCurrency
            ? `Com o dólar a ${formatMoney(organization.brlPerUsd, "BRL")}, a cotação da empresa`
            : "Mensais e anuais, por mês"
        }
      />
      <Kpi
        tone="success"
        icon={PiggyBank}
        title="Economia potencial"
        value={money(kpis.potentialSavings)}
        caption={
          kpis.redundantToCut > 0
            ? `Por mês, cortando ${plural(kpis.redundantToCut, "ferramenta redundante", "ferramentas redundantes")}`
            : "Nenhuma ferramenta redundante"
        }
      />
      <Kpi
        tone="plum"
        icon={Layers}
        title="Assinaturas ativas"
        value={String(kpis.activeCount)}
        caption={kpis.reviewCount > 0 ? `E ${kpis.reviewCount} em revisão` : "Nenhuma em revisão"}
      />
      <Kpi
        tone="warning"
        icon={BellRing}
        title={`Renovações em ${kpis.leadDays} dias`}
        value={String(kpis.renewals.length)}
        caption={
          next
            ? `Próxima: ${next.subscription.vendorName}, ${formatDaysUntil(next.daysUntil)}`
            : `Nenhuma nos próximos ${kpis.leadDays} dias`
        }
      />
    </section>
  );
}

/** Um indicador: título, número grande, legenda e o ícone na cor do kit. */
export function Kpi({
  tone,
  icon: Icon,
  title,
  value,
  caption,
}: {
  tone: keyof typeof TONES;
  icon: LucideIcon;
  title: string;
  value: string;
  caption: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        <CardAction>
          <span className={cn("grid size-9 place-items-center rounded-lg", TONES[tone])}>
            <Icon className="size-5" aria-hidden />
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl tabular-nums">{value}</p>
        <p className="text-sm text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  );
}
