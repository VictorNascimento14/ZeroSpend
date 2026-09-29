"use client";

import { Bell, CircleCheck, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { dismissWithUndo } from "@/components/alerts/alert-actions";
import { AlertItem, describeAlert } from "@/components/alerts/alert-item";
import { useAlerts } from "@/components/alerts/use-alerts";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { plural } from "@/lib/domain/format";
import { cn } from "@/lib/utils";

/**
 * O sino do header: o que pede atenção na empresa (alertas não dispensados e assinaturas em revisão),
 * de qualquer página. O número só cai quando a coisa é tratada — dispensada, confirmada ou descartada;
 * abrir o sino não marca nada como visto.
 */
export function NotificationsMenu() {
  const view = useAlerts();
  const [open, setOpen] = useState(false);
  if (!view) return null;
  const { organization, open: alerts, inReview } = view;
  const pending = alerts.length + inReview.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={
              pending > 0 ? `Notificações: ${plural(pending, "item pendente", "itens pendentes")}` : "Notificações"
            }
          />
        }
      >
        <Bell />
        {pending > 0 && (
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger-shade-100 px-1 text-[0.625rem] leading-none font-semibold text-white dark:bg-danger-tint-100 dark:text-grey-900"
          >
            {pending > 9 ? "9+" : pending}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] gap-3 p-3">
        <div className="flex items-baseline justify-between gap-3">
          <PopoverTitle className="text-base">Notificações</PopoverTitle>
          <span className="text-xs text-muted-foreground">
            {pending > 0 ? plural(pending, "pendente", "pendentes") : "Nenhuma pendente"}
          </span>
        </div>
        {pending === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleCheck className="size-4 text-success-shade-200 dark:text-success-tint-200" aria-hidden />
            Nada pedindo atenção agora.
          </p>
        ) : (
          <ul className="grid max-h-[min(60vh,26rem)] gap-2 overflow-y-auto">
            {alerts.map((alert) => (
              <AlertItem
                key={alert.key}
                alert={alert}
                organization={organization}
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Dispensar: ${describeAlert(alert, organization).title}`}
                    onClick={() => dismissWithUndo(organization.id, alert)}
                  >
                    Dispensar
                  </Button>
                }
              />
            ))}
            {inReview.length > 0 && (
              <li>
                <Link
                  href="/alertas"
                  onClick={() => setOpen(false)}
                  className="flex gap-3 rounded-lg border p-3 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-plum-tint-50 text-plum-shade-100 dark:bg-plum-shade-300/40 dark:text-plum-tint-200">
                    <ClipboardCheck className="size-4" aria-hidden />
                  </span>
                  <span className="grid gap-0.5">
                    <span className="text-sm font-medium">
                      {plural(inReview.length, "assinatura em revisão", "assinaturas em revisão")}
                    </span>
                    <span className="text-sm text-muted-foreground">Confirme ou descarte na central de alertas.</span>
                  </span>
                </Link>
              </li>
            )}
          </ul>
        )}
        <Link
          href="/alertas"
          onClick={() => setOpen(false)}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
        >
          Ver todos os alertas
        </Link>
      </PopoverContent>
    </Popover>
  );
}
