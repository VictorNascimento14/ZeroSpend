import type { Category } from "./categories";

/** Moedas de uma assinatura (modelo da especificação). */
export type Currency = "BRL" | "USD";

export type BillingCycle = "monthly" | "annually";

/**
 * O único status gravado. "Ferramenta redundante" e "renova em N dias" são derivados a cada leitura
 * e nunca se gravam.
 */
export type SubscriptionStatus = "active" | "review_needed" | "cancelled";

export type SubscriptionSource = "email_scan" | "csv_upload" | "manual";

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
