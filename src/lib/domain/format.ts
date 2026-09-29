import type { BillingCycle, Currency, IsoDate, SubscriptionSource, SubscriptionStatus } from "./types";

const moneyFormatters: Record<Currency, Intl.NumberFormat> = {
  BRL: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
  USD: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" }),
};

/** O único jeito de mostrar dinheiro: "R$ 8.450,00", "US$ 12,00" (o espaço é o não separável). */
export function formatMoney(amount: number, currency: Currency): string {
  return moneyFormatters[currency].format(amount);
}

/** "2026-10-05" → "05/10/2026", direto na string: sem `Date`, sem fuso. */
export function formatDate(date: IsoDate): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: "Mensal",
  annually: "Anual",
};

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "Ativa",
  review_needed: "Em revisão",
  cancelled: "Cancelada",
};

export const SOURCE_LABELS: Record<SubscriptionSource, string> = {
  email_scan: "E-mail",
  csv_upload: "Extrato CSV",
  manual: "Cadastro manual",
};
