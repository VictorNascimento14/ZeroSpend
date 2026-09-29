import { monthlyAmountIn, nextChargeDate } from "@/lib/domain/billing";
import { CATEGORIES, type Category } from "@/lib/domain/categories";
import { daysBetween } from "@/lib/domain/dates";
import { findRedundancies, redundantIds } from "@/lib/domain/redundancy";
import type { IsoDate, Organization, Subscription, SubscriptionStatus } from "@/lib/domain/types";

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

/** Filtro de status da lista; "redundant" é o sinal derivado, não um status gravado. */
export type StatusFilter = "all" | SubscriptionStatus | "redundant";
export type SortKey = "nextCharge" | "monthlyAmount" | "name";

export interface RowFilters {
  query: string;
  status: StatusFilter;
  category: Category | "all";
}

/** Busca sem diferenciar acento nem maiúscula: "clinica" acha "Clínica". */
function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** Aplica busca (software, categoria, responsável), status e categoria. */
export function filterRows(rows: SubscriptionRow[], { query, status, category }: RowFilters): SubscriptionRow[] {
  const needle = normalize(query.trim());
  return rows.filter(({ subscription, redundant }) => {
    if (status === "redundant" ? !redundant : status !== "all" && subscription.status !== status) return false;
    if (category !== "all" && subscription.category !== category) return false;
    if (!needle) return true;
    const fields = [subscription.vendorName, subscription.owner ?? "", CATEGORIES[subscription.category]];
    return fields.some((field) => normalize(field).includes(needle));
  });
}

/** Ordena: próxima cobrança (a ordem de `buildRows`), maior valor por mês ou nome. */
export function sortRows(rows: SubscriptionRow[], key: SortKey): SubscriptionRow[] {
  const byName = (a: SubscriptionRow, b: SubscriptionRow) =>
    a.subscription.vendorName.localeCompare(b.subscription.vendorName, "pt-BR");
  if (key === "name") return [...rows].sort(byName);
  if (key === "monthlyAmount") return [...rows].sort((a, b) => b.monthlyAmount - a.monthlyAmount || byName(a, b));
  return rows;
}
