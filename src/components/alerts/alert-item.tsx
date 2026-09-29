import { BellRing, Copy, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { Alert } from "@/lib/domain/alerts";
import { CATEGORIES } from "@/lib/domain/categories";
import { formatDate, formatDaysUntil, formatList, formatMoney } from "@/lib/domain/format";
import type { Organization } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

// Cor de estado do kit por tipo de alerta, em classes literais (classe montada em runtime não gera CSS).
const TONES: Record<Alert["kind"], string> = {
  renewal: "bg-warning-tint-50 text-warning-shade-300 dark:bg-warning-shade-300/40 dark:text-warning-tint-200",
  redundancy: "bg-danger-tint-50 text-danger-shade-100 dark:bg-danger-shade-300/40 dark:text-danger-tint-100",
};
const ICONS: Record<Alert["kind"], LucideIcon> = { renewal: BellRing, redundancy: Copy };

/**
 * O texto de um alerta, o mesmo em toda tela que o mostra. Sem artigo antes da marca ("Zoom renova…"):
 * "do/da" presumiria o gênero de cada uma.
 */
export function describeAlert(alert: Alert, organization: Organization): { title: string; description: string } {
  if (alert.kind === "renewal") {
    const { subscription, chargeDate, daysUntil } = alert;
    return {
      title: `${subscription.vendorName} renova ${formatDaysUntil(daysUntil)}`,
      description: `${formatMoney(subscription.amount, subscription.currency)} em ${formatDate(chargeDate)}.`,
    };
  }
  const { category, subscriptions, monthlySavings } = alert.group;
  return {
    title: `Duplicidade em ${CATEGORIES[category]}`,
    description: `${formatList(subscriptions.map((s) => s.vendorName))} estão na mesma categoria. Ficar só com ${
      subscriptions[0].vendorName
    } economiza ${formatMoney(monthlySavings, organization.defaultCurrency)} por mês.`,
  };
}

/** Um alerta numa lista: o ícone na cor do tipo, o título, a descrição e, se houver, a ação. */
export function AlertItem({ alert, organization, action }: { alert: Alert; organization: Organization; action?: ReactNode }) {
  const { title, description } = describeAlert(alert, organization);
  const Icon = ICONS[alert.kind];
  return (
    <li className="flex flex-wrap items-start gap-3 rounded-lg border p-3">
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", TONES[alert.kind])}>
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="grid min-w-0 flex-1 basis-48 gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </span>
      {action}
    </li>
  );
}
