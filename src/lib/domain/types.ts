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

export interface AlertChannels {
  email: boolean;
  whatsapp: boolean;
}

export interface Organization {
  id: string;
  name: string;
  /** Momento da criação, ISO 8601 com hora. */
  createdAt: string;
  /** Moeda em que a empresa vê os totais. */
  defaultCurrency: Currency;
  /** Cotação que a empresa informa: quantos reais vale um dólar. A v1 não busca cotação. */
  brlPerUsd: number;
  /** Quantos dias antes da cobrança a renovação vira alerta. */
  renewalLeadDays: number;
  /** Por onde a empresa quer ser avisada. A v1 guarda a escolha, mas não envia nada. */
  alertChannels: AlertChannels;
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
  /**
   * Quem responde pela ferramenta na empresa — texto livre, porque nem sempre a pessoa tem conta no
   * ZeroSpend. A especificação pede "marcar responsável" na tabela, sem dizer o campo.
   */
  owner?: string;
}

export const ROLES = ["admin", "member"] as const;
export type Role = (typeof ROLES)[number];

export interface User {
  id: string;
  name: string;
  /** Minúsculo e sem espaços nas pontas — é a chave de entrada. */
  email: string;
  /** PBKDF2-SHA-256 da senha (hex), com o sal ao lado. Nunca a senha em texto. */
  passwordHash: string;
  passwordSalt: string;
}

/** Quem acessa qual empresa, e com que papel. Uma pessoa pode cuidar de várias (BPO financeiro). */
/** Convite pendente: quem criar conta com este e-mail entra na empresa com este papel. */
export interface Invitation {
  id: string;
  organizationId: string;
  /** Normalizado: minúsculo, sem espaço nas pontas. */
  email: string;
  role: Role;
  invitedAt: IsoDate;
}

export interface Membership {
  userId: string;
  organizationId: string;
  role: Role;
}

/**
 * Um alerta que a empresa já tratou e dispensou. A chave identifica a situação (ver `currentAlerts`):
 * quando ela muda, o alerta volta.
 */
export interface AlertDismissal {
  organizationId: string;
  key: string;
  dismissedAt: IsoDate;
}
