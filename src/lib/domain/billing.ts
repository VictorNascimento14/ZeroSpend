import { addMonths } from "./dates";
import type { Currency, IsoDate, Organization, Subscription } from "./types";

// ponytail: dinheiro em `number` (ponto flutuante) basta para somar e mostrar totais com centavos;
// com backend, o valor vira `numeric` no banco ou centavos inteiros.

/**
 * Cotação com que uma empresa nova começa (e a da demonstração). É um valor inicial, não cotação do dia:
 * a empresa ajusta em Configurações, e a tela mostra a cotação usada ao lado do total.
 */
export const DEFAULT_BRL_PER_USD = 5.4;

/** Custo por mês na moeda da assinatura: a cobrança mensal, ou a anual dividida por 12. */
export function monthlyAmount(subscription: Subscription): number {
  return subscription.billingCycle === "annually" ? subscription.amount / 12 : subscription.amount;
}

/**
 * Converte entre real e dólar pela cotação da empresa (`brlPerUsd`: quantos reais vale um dólar;
 * a escrita garante que é maior que zero).
 * ponytail: só existem duas moedas. Com uma terceira, a cotação vira tabela por moeda — e este
 * `from === "USD" ? … : …` passaria a converter errado em silêncio.
 */
export function convertAmount(amount: number, from: Currency, to: Currency, brlPerUsd: number): number {
  if (from === to) return amount;
  return from === "USD" ? amount * brlPerUsd : amount / brlPerUsd;
}

/** Custo por mês na moeda padrão da empresa. Arredonda só quem mostra, com `formatMoney`. */
export function monthlyAmountIn(subscription: Subscription, organization: Organization): number {
  return convertAmount(
    monthlyAmount(subscription),
    subscription.currency,
    organization.defaultCurrency,
    organization.brlPerUsd,
  );
}

/** Gasto mensal da empresa, na moeda padrão dela. Cancelada não conta; "em revisão" conta. */
export function totalMonthlySpend(subscriptions: Subscription[], organization: Organization): number {
  return subscriptions
    .filter((subscription) => subscription.status !== "cancelled")
    .reduce((total, subscription) => total + monthlyAmountIn(subscription, organization), 0);
}

/**
 * A próxima cobrança a partir de `today`. Se a data gravada já passou, avança de ciclo em ciclo a
 * partir dela — sempre do dia-âncora, para 31/01 virar 28/02 e depois 31/03, e não 28/03. A data
 * gravada não muda: isto é sinal derivado.
 */
export function nextChargeDate(subscription: Subscription, today: IsoDate): IsoDate {
  const step = subscription.billingCycle === "annually" ? 12 : 1;
  let next = subscription.nextBillingDate;
  for (let cycles = 1; next < today; cycles++) {
    next = addMonths(subscription.nextBillingDate, cycles * step);
  }
  return next;
}
