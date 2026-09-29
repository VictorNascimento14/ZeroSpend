import { isCategory } from "./categories";
import { isIsoDate } from "./dates";
import {
  BILLING_CYCLES,
  CURRENCIES,
  SUBSCRIPTION_SOURCES,
  SUBSCRIPTION_STATUSES,
  type Currency,
  type Organization,
  type Subscription,
} from "./types";

/** O que a tela (ou a importação) entrega para criar uma assinatura: tudo menos a identidade. */
export type SubscriptionDraft = Omit<Subscription, "id" | "organizationId">;

/** Um erro por campo, com a mensagem que a tela mostra. Objeto vazio é válido. */
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

/** Tamanho máximo do responsável: um nome, não um texto. */
export const OWNER_MAX = 80;

function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return (list as readonly unknown[]).includes(value);
}

/**
 * A regra de um cadastro válido. Confere o valor em tempo de execução, não só o tipo: o que vem de
 * formulário, CSV ou `localStorage` pode chegar torto mesmo tipado.
 */
export function validateSubscriptionDraft(draft: SubscriptionDraft): FieldErrors<SubscriptionDraft> {
  const errors: FieldErrors<SubscriptionDraft> = {};
  if (typeof draft.vendorName !== "string" || !draft.vendorName.trim()) {
    errors.vendorName = "Informe o nome do software.";
  }
  if (!isCategory(draft.category)) errors.category = "Escolha uma categoria da lista.";
  if (!Number.isFinite(draft.amount) || draft.amount <= 0) errors.amount = "O valor precisa ser maior que zero.";
  if (!isOneOf(CURRENCIES, draft.currency)) errors.currency = "Escolha real ou dólar.";
  if (!isOneOf(BILLING_CYCLES, draft.billingCycle)) errors.billingCycle = "Escolha mensal ou anual.";
  if (!isIsoDate(draft.nextBillingDate)) errors.nextBillingDate = "Informe uma data válida.";
  if (!isOneOf(SUBSCRIPTION_STATUSES, draft.status)) errors.status = "Status desconhecido.";
  if (!isOneOf(SUBSCRIPTION_SOURCES, draft.source)) errors.source = "Origem desconhecida.";
  if (draft.owner !== undefined && (typeof draft.owner !== "string" || draft.owner.trim().length > OWNER_MAX)) {
    errors.owner = `Use até ${OWNER_MAX} caracteres.`;
  }
  return errors;
}

/** O que a tela de criar conta entrega. */
export interface AccountDraft {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}

/**
 * Provedores de e-mail pessoal: a especificação pede conta com e-mail corporativo.
 * ponytail: lista fixa dos mais comuns no Brasil. Com backend, a conta confirma o domínio por e-mail.
 */
export const PERSONAL_EMAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "hotmail.com.br",
  "outlook.com",
  "outlook.com.br",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.com.br",
  "icloud.com",
  "me.com",
  "bol.com.br",
  "uol.com.br",
  "terra.com.br",
  "ig.com.br",
  "proton.me",
  "protonmail.com",
] as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** As regras de uma conta nova. O e-mail chega já normalizado (minúsculo, sem espaço nas pontas). */
export function validateAccountDraft(draft: AccountDraft): FieldErrors<AccountDraft> {
  const errors: FieldErrors<AccountDraft> = {};
  if (!draft.name.trim()) errors.name = "Informe seu nome.";
  if (!EMAIL.test(draft.email)) {
    errors.email = "Informe um e-mail válido.";
  } else if ((PERSONAL_EMAIL_DOMAINS as readonly string[]).includes(draft.email.split("@")[1])) {
    errors.email = "Use o e-mail da empresa — Gmail, Outlook e parecidos não valem.";
  }
  if (draft.password.length < 8) errors.password = "A senha precisa de pelo menos 8 caracteres.";
  if (!draft.organizationName.trim()) errors.organizationName = "Informe o nome da empresa.";
  return errors;
}

/** O que a tela de configurações muda na empresa. */
export type OrganizationDraft = Pick<Organization, "name" | "defaultCurrency" | "brlPerUsd">;

/** Teto de sanidade da cotação: pega o "540" digitado sem a vírgula, que multiplicaria o dólar por 100. */
export const BRL_PER_USD_MAX = 100;

export function validateOrganizationDraft(draft: OrganizationDraft): FieldErrors<OrganizationDraft> {
  const errors: FieldErrors<OrganizationDraft> = {};
  if (!draft.name.trim()) errors.name = "Informe o nome da empresa.";
  if (!(CURRENCIES as readonly Currency[]).includes(draft.defaultCurrency)) {
    errors.defaultCurrency = "Escolha a moeda padrão.";
  }
  if (!Number.isFinite(draft.brlPerUsd) || draft.brlPerUsd <= 0 || draft.brlPerUsd > BRL_PER_USD_MAX) {
    errors.brlPerUsd = "Informe quantos reais vale um dólar, entre R$ 0,01 e R$ 100,00.";
  }
  return errors;
}
