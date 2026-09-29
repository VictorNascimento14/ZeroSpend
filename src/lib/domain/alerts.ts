import { nextChargeDate } from "./billing";
import { addDays, daysBetween } from "./dates";
import type { IsoDate, Subscription } from "./types";

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
