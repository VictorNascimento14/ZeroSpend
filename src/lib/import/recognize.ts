import { addMonths } from "@/lib/domain/dates";
import { toWords } from "@/lib/domain/text";
import type { IsoDate, Subscription } from "@/lib/domain/types";
import type { SubscriptionDraft } from "@/lib/domain/validation";
import type { StatementLine } from "./csv";
import { recognizeVendor, type KnownVendor } from "./vendors";

export interface DetectedSubscription {
  vendor: KnownVendor;
  /** Valor da cobrança mais recente, em reais (o extrato do cartão é em real, mesmo para serviço em dólar). */
  amount: number;
  lastChargeDate: IsoDate;
  charges: number;
}

export interface StatementReading {
  detected: DetectedSubscription[];
  /** Compras que o catálogo não reconheceu — a tela mostra, para ninguém achar que sumiram. */
  unrecognized: StatementLine[];
  /** Linhas com o sinal contrário ao das compras (pagamento da fatura, estorno). */
  ignoredCredits: number;
}

/**
 * Das linhas do extrato para as assinaturas detectadas. O sinal das compras é o da maioria (cada banco
 * escreve de um jeito); o resto é crédito e fica de fora. Cada fornecedor reconhecido vira uma
 * detecção, com a cobrança mais recente.
 */
export function readStatement(lines: StatementLine[]): StatementReading {
  const negatives = lines.filter((line) => line.amount < 0).length;
  const purchaseSign = negatives > lines.length / 2 ? -1 : 1;
  const purchases = lines.filter((line) => Math.sign(line.amount) === purchaseSign && line.amount !== 0);

  const byVendor = new Map<string, DetectedSubscription>();
  const unrecognized: StatementLine[] = [];
  for (const purchase of purchases) {
    const vendor = recognizeVendor(purchase.description);
    if (!vendor) {
      unrecognized.push(purchase);
      continue;
    }
    const known = byVendor.get(vendor.name);
    const amount = Math.abs(purchase.amount);
    if (!known) byVendor.set(vendor.name, { vendor, amount, lastChargeDate: purchase.date, charges: 1 });
    else {
      known.charges++;
      if (purchase.date >= known.lastChargeDate) Object.assign(known, { amount, lastChargeDate: purchase.date });
    }
  }
  return {
    detected: [...byVendor.values()].sort((a, b) => a.vendor.name.localeCompare(b.vendor.name, "pt-BR")),
    unrecognized,
    ignoredCredits: lines.length - purchases.length,
  };
}

/**
 * A detecção como assinatura em revisão: mensal (um extrato não mostra o ciclo), em real, com a
 * próxima cobrança um mês depois da última.
 */
export function toDraft(detected: DetectedSubscription): SubscriptionDraft {
  return {
    vendorName: detected.vendor.name,
    category: detected.vendor.category,
    amount: detected.amount,
    currency: "BRL",
    billingCycle: "monthly",
    nextBillingDate: addMonths(detected.lastChargeDate, 1),
    status: "review_needed",
    source: "csv_upload",
  };
}

/** Já existe na empresa (não cancelada, mesmo nome)? A importação não cadastra de novo. */
export function isAlreadyTracked(detected: DetectedSubscription, subscriptions: Subscription[]): boolean {
  const name = toWords(detected.vendor.name);
  return subscriptions.some((s) => s.status !== "cancelled" && toWords(s.vendorName) === name);
}
