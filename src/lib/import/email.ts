import type { Category } from "@/lib/domain/categories";
import { addDays } from "@/lib/domain/dates";
import type { Currency, IsoDate } from "@/lib/domain/types";

/**
 * O que fica de uma fatura achada no e-mail: só os metadados. O corpo e o assunto da mensagem nunca
 * são guardados (especificação, LGPD).
 */
export interface InvoiceMetadata {
  vendorName: string;
  amount: number;
  currency: Currency;
  date: IsoDate;
  category: Category;
}

export interface EmailProvider {
  id: "google" | "microsoft";
  name: string;
  /** A permissão, só de leitura, que a conexão de verdade vai pedir. */
  scope: string;
}

export const EMAIL_PROVIDERS: EmailProvider[] = [
  { id: "google", name: "Google Workspace", scope: "gmail.readonly" },
  { id: "microsoft", name: "Microsoft 365", scope: "Mail.Read" },
];

/**
 * As faturas de exemplo da conexão simulada — a v1 não tem servidor para ler e-mail (ADR-001). As
 * datas andam com o dia de hoje, para o exemplo parecer recente.
 */
export function demoInvoices(today: IsoDate): InvoiceMetadata[] {
  return [
    { vendorName: "Miro", amount: 16, currency: "USD", date: addDays(today, -2), category: "design" },
    { vendorName: "Notion", amount: 10, currency: "USD", date: addDays(today, -6), category: "productivity" },
    { vendorName: "Omie", amount: 199, currency: "BRL", date: addDays(today, -9), category: "finance" },
    { vendorName: "Zendesk", amount: 55, currency: "USD", date: addDays(today, -14), category: "communication" },
  ];
}
