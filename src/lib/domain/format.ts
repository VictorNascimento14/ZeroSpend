import type { BillingCycle, Currency, IsoDate, Role, SubscriptionSource, SubscriptionStatus } from "./types";

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

/** "hoje", "amanhã", "em 5 dias" — a distância até uma cobrança, como a tela fala. */
export function formatDaysUntil(days: number): string {
  if (days === 0) return "hoje";
  if (days === 1) return "amanhã";
  return `em ${days} dias`;
}

/**
 * "1 ferramenta", "2 ferramentas", "0 ferramentas". Não usa `Intl.PluralRules`: no português do
 * Brasil ele trata o zero como singular ("0 ferramenta").
 */
export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

const listFormatter = new Intl.ListFormat("pt-BR", { type: "conjunction" });

/** "Figma e Canva", "Figma, Canva e Miro". */
export function formatList(items: string[]): string {
  return listFormatter.format(items);
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administração",
  member: "Membro",
};

/** "Pessoa Exemplo" → "PE": o avatar de quem não tem foto (e ninguém tem, na v1). */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export const CURRENCY_LABELS: Record<Currency, string> = {
  BRL: "Real (R$)",
  USD: "Dólar (US$)",
};

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
