import { nextChargeDate } from "./billing";
import { addDays, daysBetween } from "./dates";
import { findRedundancies, type RedundancyGroup } from "./redundancy";
import type { IsoDate, Organization, Subscription } from "./types";

/** A antecedência da especificação: avisar 7 dias antes da renovação. */
export const DEFAULT_RENEWAL_LEAD_DAYS = 7;

export interface RenewalAlert {
  subscription: Subscription;
  /** A próxima cobrança efetiva (já avançada, se a data gravada passou). */
  chargeDate: IsoDate;
  /** Dias de hoje até a cobrança: 0 é hoje. */
  daysUntil: number;
}

/**
 * Assinaturas que renovam de hoje até `leadDays` dias depois (as duas pontas contam), da mais próxima
 * para a mais distante. Cancelada não gera alerta; em revisão gera — a cobrança é real até alguém
 * descartar. Sinal derivado: calculado a cada leitura, nunca gravado.
 */
export function renewalAlerts(
  subscriptions: Subscription[],
  today: IsoDate,
  leadDays: number = DEFAULT_RENEWAL_LEAD_DAYS,
): RenewalAlert[] {
  const limit = addDays(today, leadDays);
  return subscriptions
    .filter((subscription) => subscription.status !== "cancelled")
    .map((subscription) => {
      const chargeDate = nextChargeDate(subscription, today);
      return { subscription, chargeDate, daysUntil: daysBetween(today, chargeDate) };
    })
    .filter((alert) => alert.chargeDate <= limit)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

/** Um alerta da empresa: renovação dentro da antecedência ou grupo de ferramentas redundantes. */
export type Alert =
  | ({ kind: "renewal"; key: string } & RenewalAlert)
  | { kind: "redundancy"; key: string; group: RedundancyGroup };

/**
 * Os alertas de agora: as renovações (da mais próxima) e as duplicidades (da maior economia). A chave
 * nomeia a situação, não só a assinatura — a renovação leva a data da cobrança, e a duplicidade, quem
 * está no grupo. Dispensar vale para aquela situação: a cobrança do mês seguinte, ou uma ferramenta
 * nova na categoria, alertam de novo.
 */
export function currentAlerts(
  subscriptions: Subscription[],
  organization: Organization,
  today: IsoDate,
  leadDays: number = DEFAULT_RENEWAL_LEAD_DAYS,
): Alert[] {
  return [
    ...renewalAlerts(subscriptions, today, leadDays).map((alert) => ({
      kind: "renewal" as const,
      key: `renovacao:${alert.subscription.id}:${alert.chargeDate}`,
      ...alert,
    })),
    ...findRedundancies(subscriptions, organization).map((group) => ({
      kind: "redundancy" as const,
      key: `redundancia:${group.category}:${group.subscriptions.map((subscription) => subscription.id).sort().join(",")}`,
      group,
    })),
  ];
}
