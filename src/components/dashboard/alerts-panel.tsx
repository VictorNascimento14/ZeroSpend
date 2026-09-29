"use client";

import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { AlertItem } from "@/components/alerts/alert-item";
import { useAlerts } from "@/components/alerts/use-alerts";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * O painel lateral do dashboard: os alertas que a empresa ainda não dispensou — renovações dentro da
 * antecedência (da mais próxima) e duplicidades (da maior economia). Tratar é na central de alertas.
 */
export function AlertsPanel({ className }: { className?: string }) {
  const view = useAlerts();
  if (!view) return null;
  const { organization, open: alerts } = view;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Alertas e duplicidades</CardTitle>
        <CardDescription>O que pede atenção nesta empresa.</CardDescription>
        <CardAction>
          <Link href="/alertas" aria-label="Ver todos os alertas" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Ver todos
          </Link>
        </CardAction>
      </CardHeader>
      {/* As colunas da lista seguem a largura do painel (consulta de contêiner), não a da tela. */}
      <CardContent className="@container">
        {alerts.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleCheck className="size-4 text-success-shade-200 dark:text-success-tint-200" aria-hidden />
            Nada pedindo atenção agora.
          </p>
        ) : (
          <ul className="grid gap-3 @lg:grid-cols-2 @4xl:grid-cols-3">
            {alerts.map((alert) => (
              <AlertItem key={alert.key} alert={alert} organization={organization} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
