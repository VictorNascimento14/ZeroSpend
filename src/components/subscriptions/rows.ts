import { monthlyAmountIn, nextChargeDate } from "@/lib/domain/billing";
import { daysBetween } from "@/lib/domain/dates";
import { findRedundancies, redundantIds } from "@/lib/domain/redundancy";
import type { IsoDate, Organization, Subscription } from "@/lib/domain/types";

/** Uma linha da tabela de assinaturas: a assinatura e o que se calcula dela para mostrar. */
export interface SubscriptionRow {
  subscription: Subscription;
  /** Custo por mês na moeda padrão da empresa. */
  monthlyAmount: number;
  /** Próxima cobrança efetiva; a cancelada não tem. */
  chargeDate: IsoDate | null;
  daysUntil: number | null;
  /** Divide a categoria com outra (tag "Ferramenta redundante"). */
  redundant: boolean;
}

/** As linhas, da cobrança mais próxima para a mais distante; as canceladas no fim, por nome. */
export function buildRows(subscriptions: Subscription[], organization: Organization, today: IsoDate): SubscriptionRow[] {
  const redundant = redundantIds(findRedundancies(subscriptions, organization));
  return subscriptions
    .map((subscription) => {
      const chargeDate = subscription.status === "cancelled" ? null : nextChargeDate(subscription, today);
      return {
        subscription,
        monthlyAmount: monthlyAmountIn(subscription, organization),
        chargeDate,
        daysUntil: chargeDate ? daysBetween(today, chargeDate) : null,
        redundant: redundant.has(subscription.id),
      };
    })
    .sort(
      (a, b) =>
        Number(a.chargeDate === null) - Number(b.chargeDate === null) ||
        (a.chargeDate ?? "").localeCompare(b.chargeDate ?? "") ||
        a.subscription.vendorName.localeCompare(b.subscription.vendorName, "pt-BR"),
    );
}
