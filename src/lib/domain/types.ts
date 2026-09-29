import type { Category } from "./categories";

/** Moedas de uma assinatura (modelo da especificação). */
export const CURRENCIES = ["BRL", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const BILLING_CYCLES = ["monthly", "annually"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

/**
 * O único status gravado. "Ferramenta redundante" e "renova em N dias" são derivados a cada leitura
 * e nunca se gravam.
 */
export const SUBSCRIPTION_STATUSES = ["active", "review_needed", "cancelled"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_SOURCES = ["email_scan", "csv_upload", "manual"] as const;
export type SubscriptionSource = (typeof SUBSCRIPTION_SOURCES)[number];

/**
 * Data sem hora, `YYYY-MM-DD`. Nunca passe por `new Date("YYYY-MM-DD")`: isso é meia-noite UTC e
 * vira o dia anterior no Brasil. Os helpers de `dates.ts` e `format.ts` tratam a string direto.
 */
export type IsoDate = string;

export interface Organization {
  id: string;
  name: string;
  /** Momento da criação, ISO 8601 com hora. */
  createdAt: string;
  /** Moeda em que a empresa vê os totais. */
  defaultCurrency: Currency;
  /** Cotação que a empresa informa: quantos reais vale um dólar. A v1 não busca cotação. */
  brlPerUsd: number;
}

export interface Subscription {
  id: string;
  organizationId: string;
  vendorName: string;
  category: Category;
  /** Valor de UMA cobrança, na `currency` da assinatura — não é o valor por mês. */
  amount: number;
  currency: Currency;
  billingCycle: BillingCycle;
  nextBillingDate: IsoDate;
  status: SubscriptionStatus;
  source: SubscriptionSource;
}
