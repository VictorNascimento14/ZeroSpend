import { isCategory } from "./categories";
import { isIsoDate } from "./dates";
import {
  BILLING_CYCLES,
  CURRENCIES,
  SUBSCRIPTION_SOURCES,
  SUBSCRIPTION_STATUSES,
  type Subscription,
} from "./types";

/** O que a tela (ou a importação) entrega para criar uma assinatura: tudo menos a identidade. */
export type SubscriptionDraft = Omit<Subscription, "id" | "organizationId">;

/** Um erro por campo, com a mensagem que a tela mostra. Objeto vazio é válido. */
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

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
  return errors;
}
