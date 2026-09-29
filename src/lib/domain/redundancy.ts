import { monthlyAmountIn } from "./billing";
import type { Category } from "./categories";
import type { Organization, Subscription } from "./types";

/** "Outros" junta ferramentas que não se substituem (ChatGPT e Acrobat não são duplicata). */
const CATEGORIES_WITHOUT_REDUNDANCY: readonly Category[] = ["other"];

export interface RedundancyGroup {
  category: Category;
  /** Da mais cara para a mais barata, por mês. A primeira é a que a estimativa mantém. */
  subscriptions: Subscription[];
  /** Economia mensal estimada, na moeda padrão: o custo de todas menos a mais cara. */
  monthlySavings: number;
}

/**
 * Ferramentas redundantes (regra da especificação): mais de uma assinatura na mesma categoria.
 * Cancelada não conta; em revisão conta. A economia é conservadora — mantém a mais cara do grupo,
 * que em geral é a ferramenta principal, e soma o resto. Sinal derivado, nunca gravado.
 */
export function findRedundancies(subscriptions: Subscription[], organization: Organization): RedundancyGroup[] {
  const byCategory = new Map<Category, Subscription[]>();
  for (const subscription of subscriptions) {
    if (subscription.status === "cancelled") continue;
    if (CATEGORIES_WITHOUT_REDUNDANCY.includes(subscription.category)) continue;
    byCategory.set(subscription.category, [...(byCategory.get(subscription.category) ?? []), subscription]);
  }

  const cost = (subscription: Subscription) => monthlyAmountIn(subscription, organization);
  return [...byCategory]
    .filter(([, group]) => group.length > 1)
    .map(([category, group]) => {
      const sorted = [...group].sort((a, b) => cost(b) - cost(a) || a.vendorName.localeCompare(b.vendorName));
      const monthlySavings = sorted.slice(1).reduce((total, subscription) => total + cost(subscription), 0);
      return { category, subscriptions: sorted, monthlySavings };
    })
    .sort((a, b) => b.monthlySavings - a.monthlySavings);
}

/** Economia potencial da empresa por mês: a soma das economias dos grupos redundantes. */
export function potentialMonthlySavings(groups: RedundancyGroup[]): number {
  return groups.reduce((total, group) => total + group.monthlySavings, 0);
}

/** Os ids que levam a tag "Ferramenta redundante" na tabela. */
export function redundantIds(groups: RedundancyGroup[]): Set<string> {
  return new Set(groups.flatMap((group) => group.subscriptions.map((subscription) => subscription.id)));
}
