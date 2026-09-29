"use client";

import { BellRing, CircleCheck, Copy, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganizationData } from "@/lib/data/store";
import { renewalAlerts } from "@/lib/domain/alerts";
import { CATEGORIES } from "@/lib/domain/categories";
import { toIsoDate } from "@/lib/domain/dates";
import { formatDate, formatDaysUntil, formatList, formatMoney } from "@/lib/domain/format";
import { findRedundancies } from "@/lib/domain/redundancy";
import { cn } from "@/lib/utils";

const TONES = {
  renewal: "bg-warning-tint-50 text-warning-shade-300 dark:bg-warning-shade-300/40 dark:text-warning-tint-200",
  redundancy: "bg-danger-tint-50 text-danger-shade-100 dark:bg-danger-shade-300/40 dark:text-danger-tint-100",
} as const;

interface Recommendation {
  key: string;
  tone: keyof typeof TONES;
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * O painel lateral do dashboard: renovações dentro da antecedência (da mais próxima) e duplicidades
 * (da maior economia). O texto não põe artigo antes da marca ("Zoom renova…"): "do/da" presumiria o
 * gênero de cada uma.
 */
export function AlertsPanel({ className }: { className?: string }) {
  const data = useOrganizationData();
  if (!data) return null;
  const { organization } = data.session;
  const today = toIsoDate(new Date());

  const recommendations: Recommendation[] = [
    ...renewalAlerts(data.subscriptions, today).map(({ subscription, chargeDate, daysUntil }) => ({
      key: `renovacao-${subscription.id}`,
      tone: "renewal" as const,
      icon: BellRing,
      title: `${subscription.vendorName} renova ${formatDaysUntil(daysUntil)}`,
      description: `${formatMoney(subscription.amount, subscription.currency)} em ${formatDate(chargeDate)}.`,
    })),
    ...findRedundancies(data.subscriptions, organization).map((group) => ({
      key: `duplicidade-${group.category}`,
      tone: "redundancy" as const,
      icon: Copy,
      title: `Duplicidade em ${CATEGORIES[group.category]}`,
      description: `${formatList(group.subscriptions.map((s) => s.vendorName))} estão na mesma categoria. Ficar só com ${
        group.subscriptions[0].vendorName
      } economiza ${formatMoney(group.monthlySavings, organization.defaultCurrency)} por mês.`,
    })),
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Alertas e duplicidades</CardTitle>
        <CardDescription>O que pede atenção nesta empresa.</CardDescription>
      </CardHeader>
      {/* As colunas da lista seguem a largura do painel (consulta de contêiner), não a da tela. */}
      <CardContent className="@container">
        {recommendations.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleCheck className="size-4 text-success-shade-200 dark:text-success-tint-200" aria-hidden />
            Nada pedindo atenção agora.
          </p>
        ) : (
          <ul className="grid gap-3 @lg:grid-cols-2 @4xl:grid-cols-3">
            {recommendations.map(({ key, tone, icon: Icon, title, description }) => (
              <li key={key} className="flex gap-3 rounded-lg border p-3">
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", TONES[tone])}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="grid gap-0.5">
                  <span className="text-sm font-medium">{title}</span>
                  <span className="text-sm text-muted-foreground">{description}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
