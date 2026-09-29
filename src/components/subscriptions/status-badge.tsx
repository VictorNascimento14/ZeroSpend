import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/domain/format";
import type { SubscriptionStatus } from "@/lib/domain/types";

// Cores de estado do kit, em classes literais (classe montada em runtime não gera CSS). Contraste AA
// conferido: texto shade sobre tint-50 no claro; texto tint sobre shade-300 a 40% no escuro.
const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  active:
    "border-success-tint-200 bg-success-tint-50 text-success-shade-200 dark:border-success-shade-200 dark:bg-success-shade-300/40 dark:text-success-tint-200",
  review_needed:
    "border-warning-tint-200 bg-warning-tint-50 text-warning-shade-300 dark:border-warning-shade-200 dark:bg-warning-shade-300/40 dark:text-warning-tint-200",
  cancelled: "border-grey-200 bg-grey-50 text-grey-600 dark:border-grey-600 dark:bg-grey-700/40 dark:text-grey-300",
};

export function StatusBadge({ status }: { status: SubscriptionStatus }) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

/** Sinal derivado, não status gravado: divide a categoria com outra ferramenta. */
export function RedundantBadge() {
  return (
    <Badge
      variant="outline"
      className="border-danger-tint-200 bg-danger-tint-50 text-danger-shade-100 dark:border-danger-shade-200 dark:bg-danger-shade-300/40 dark:text-danger-tint-100"
    >
      Ferramenta redundante
    </Badge>
  );
}
