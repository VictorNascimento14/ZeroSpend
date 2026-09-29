"use client";

import { CircleCheck } from "lucide-react";
import type { ReactNode } from "react";
import { confirmDetection, discardDetection } from "@/components/subscriptions/subscription-actions";
import { VendorAvatar } from "@/components/subscriptions/vendor-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepository } from "@/lib/data/store";
import { DEFAULT_RENEWAL_LEAD_DAYS, type Alert } from "@/lib/domain/alerts";
import { formatMoney, plural, SOURCE_LABELS } from "@/lib/domain/format";
import { dismissWithUndo } from "./alert-actions";
import { AlertItem, describeAlert } from "./alert-item";
import { useAlerts } from "./use-alerts";

/**
 * A central de alertas da empresa: renovações e duplicidades, que se dispensam quando já foram
 * tratadas, e as assinaturas em revisão, que se resolvem confirmando ou descartando.
 */
export function AlertsCenter() {
  const view = useAlerts();
  if (!view) return null;
  const { organization, open, dismissed, inReview } = view;

  const dismissButton = (alert: Alert) => (
    <Button
      variant="outline"
      size="sm"
      aria-label={`Dispensar: ${describeAlert(alert, organization).title}`}
      onClick={() => dismissWithUndo(organization.id, alert)}
    >
      Dispensar
    </Button>
  );

  return (
    <div className="grid max-w-4xl gap-6">
      <Section
        title={`Renovações nos próximos ${DEFAULT_RENEWAL_LEAD_DAYS} dias`}
        description="Da mais próxima para a mais distante. Dispense a que já está prevista: ela volta na cobrança seguinte."
        empty={`Nenhuma renovação nos próximos ${DEFAULT_RENEWAL_LEAD_DAYS} dias.`}
      >
        {open
          .filter((alert) => alert.kind === "renewal")
          .map((alert) => (
            <AlertItem key={alert.key} alert={alert} organization={organization} action={dismissButton(alert)} />
          ))}
      </Section>
      <Section
        title="Ferramentas redundantes"
        description="Mais de uma ferramenta na mesma categoria. Dispensada, a duplicidade volta se o grupo mudar."
        empty="Nenhuma ferramenta redundante."
      >
        {open
          .filter((alert) => alert.kind === "redundancy")
          .map((alert) => (
            <AlertItem key={alert.key} alert={alert} organization={organization} action={dismissButton(alert)} />
          ))}
      </Section>
      <Section
        title="Em revisão"
        description="Detectadas no extrato ou no e-mail e ainda não confirmadas. A cobrança conta até alguém descartar."
        empty="Nada em revisão."
      >
        {inReview.map((subscription) => (
          <li key={subscription.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
            <VendorAvatar name={subscription.vendorName} />
            <span className="grid min-w-0 flex-1 basis-48 gap-0.5">
              <span className="text-sm font-medium">{subscription.vendorName}</span>
              <span className="text-sm text-muted-foreground">
                {formatMoney(subscription.amount, subscription.currency)} · {SOURCE_LABELS[subscription.source]}
              </span>
            </span>
            <span className="flex gap-2">
              <Button size="sm" aria-label={`Confirmar ${subscription.vendorName}`} onClick={() => confirmDetection(subscription)}>
                Confirmar
              </Button>
              <Button
                variant="outline"
                size="sm"
                aria-label={`Descartar ${subscription.vendorName}`}
                onClick={() => discardDetection(subscription)}
              >
                Descartar
              </Button>
            </span>
          </li>
        ))}
      </Section>
      {dismissed.length > 0 && (
        <details className="rounded-xl border bg-card text-sm">
          <summary className="cursor-pointer px-4 py-3 font-medium">
            {plural(dismissed.length, "alerta dispensado", "alertas dispensados")}
          </summary>
          <ul className="grid gap-3 border-t p-4">
            {dismissed.map((alert) => (
              <AlertItem
                key={alert.key}
                alert={alert}
                organization={organization}
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Voltar a mostrar: ${describeAlert(alert, organization).title}`}
                    onClick={() => getRepository().restoreAlert(organization.id, alert.key)}
                  >
                    Voltar a mostrar
                  </Button>
                }
              />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function Section({
  title,
  description,
  empty,
  children,
}: {
  title: string;
  description: string;
  empty: string;
  children: ReactNode[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children.length > 0 ? (
          <ul className="grid gap-3">{children}</ul>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleCheck className="size-4 text-success-shade-200 dark:text-success-tint-200" aria-hidden />
            {empty}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
