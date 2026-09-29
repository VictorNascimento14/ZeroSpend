import { DEFAULT_RENEWAL_LEAD_DAYS, renewalAlerts, type RenewalAlert } from "./alerts";
import { totalMonthlySpend } from "./billing";
import { findRedundancies, potentialMonthlySavings } from "./redundancy";
import type { IsoDate, Organization, Subscription } from "./types";

/** Os números dos cards do dashboard, calculados a cada leitura (nada disto se grava). */
export interface Kpis {
  /** Gasto por mês na moeda padrão, sem as canceladas. */
  monthlySpend: number;
  /** Alguma assinatura em outra moeda entrou no gasto pela cotação da empresa. */
  convertedCurrency: boolean;
  potentialSavings: number;
  /** Quantas ferramentas a economia potencial corta (todas do grupo menos a que fica). */
  redundantToCut: number;
  activeCount: number;
  reviewCount: number;
  /** Renovações dentro da antecedência, da mais próxima para a mais distante. */
  renewals: RenewalAlert[];
  leadDays: number;
}

export function computeKpis(
  subscriptions: Subscription[],
  organization: Organization,
  today: IsoDate,
  leadDays: number = DEFAULT_RENEWAL_LEAD_DAYS,
): Kpis {
  const counted = subscriptions.filter((subscription) => subscription.status !== "cancelled");
  const groups = findRedundancies(subscriptions, organization);
  return {
    monthlySpend: totalMonthlySpend(subscriptions, organization),
    convertedCurrency: counted.some((subscription) => subscription.currency !== organization.defaultCurrency),
    potentialSavings: potentialMonthlySavings(groups),
    redundantToCut: groups.reduce((total, group) => total + group.subscriptions.length - 1, 0),
    activeCount: counted.filter((subscription) => subscription.status === "active").length,
    reviewCount: counted.filter((subscription) => subscription.status === "review_needed").length,
    renewals: renewalAlerts(subscriptions, today, leadDays),
    leadDays,
  };
}
