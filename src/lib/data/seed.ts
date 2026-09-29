import { addDays } from "@/lib/domain/dates";
import type { IsoDate, Organization, Subscription } from "@/lib/domain/types";

/**
 * A conta de demonstração — tudo fictício (regra de sigilo do cofre); nome de fornecedor é nome
 * público de produto. As datas são relativas a `today`, para a demonstração não envelhecer.
 *
 * Cada item existe por uma regra: Figma + Canva e HubSpot + Pipedrive são as redundâncias; Dropbox é
 * a cancelada; ChatGPT Team e Adobe Acrobat Pro vieram do extrato e estão em revisão; há cobrança em
 * dólar, plano anual e três renovações dentro de uma semana (GitHub, Google Workspace e Zoom).
 */
export const DEMO_ORGANIZATION_IDS = {
  tecnologia: "org-exemplo-tecnologia",
  clinica: "org-clinica-exemplo",
} as const;

interface DemoSubscription extends Omit<Subscription, "id" | "organizationId" | "nextBillingDate"> {
  /** Dias entre `today` e a próxima cobrança. */
  inDays: number;
}

const TECNOLOGIA: DemoSubscription[] = [
  { vendorName: "Slack", category: "communication", amount: 880, currency: "BRL", billingCycle: "monthly", inDays: 12, status: "active", source: "manual" },
  { vendorName: "Zoom", category: "meetings", amount: 159.9, currency: "BRL", billingCycle: "monthly", inDays: 5, status: "active", source: "email_scan" },
  { vendorName: "Google Workspace", category: "productivity", amount: 1176, currency: "BRL", billingCycle: "monthly", inDays: 3, status: "active", source: "manual" },
  { vendorName: "Figma", category: "design", amount: 75, currency: "USD", billingCycle: "monthly", inDays: 18, status: "active", source: "csv_upload" },
  { vendorName: "Canva", category: "design", amount: 1199, currency: "BRL", billingCycle: "annually", inDays: 40, status: "active", source: "csv_upload" },
  { vendorName: "HubSpot", category: "crm", amount: 1450, currency: "BRL", billingCycle: "monthly", inDays: 9, status: "active", source: "manual" },
  { vendorName: "Pipedrive", category: "crm", amount: 99, currency: "USD", billingCycle: "monthly", inDays: 21, status: "active", source: "csv_upload" },
  { vendorName: "GitHub", category: "development", amount: 84, currency: "USD", billingCycle: "monthly", inDays: 2, status: "active", source: "csv_upload" },
  { vendorName: "RD Station Marketing", category: "marketing", amount: 890, currency: "BRL", billingCycle: "monthly", inDays: 26, status: "active", source: "manual" },
  { vendorName: "Conta Azul", category: "finance", amount: 229, currency: "BRL", billingCycle: "monthly", inDays: 15, status: "active", source: "manual" },
  { vendorName: "Gupy", category: "hr", amount: 7800, currency: "BRL", billingCycle: "annually", inDays: 120, status: "active", source: "manual" },
  { vendorName: "1Password", category: "security", amount: 239.4, currency: "USD", billingCycle: "annually", inDays: 200, status: "active", source: "email_scan" },
  { vendorName: "Dropbox", category: "storage", amount: 119, currency: "BRL", billingCycle: "monthly", inDays: 8, status: "cancelled", source: "csv_upload" },
  { vendorName: "ChatGPT Team", category: "other", amount: 60, currency: "USD", billingCycle: "monthly", inDays: 10, status: "review_needed", source: "csv_upload" },
  { vendorName: "Adobe Acrobat Pro", category: "other", amount: 85, currency: "BRL", billingCycle: "monthly", inDays: 25, status: "review_needed", source: "csv_upload" },
];

const CLINICA: DemoSubscription[] = [
  { vendorName: "Google Workspace", category: "productivity", amount: 294, currency: "BRL", billingCycle: "monthly", inDays: 14, status: "active", source: "manual" },
  { vendorName: "Canva", category: "design", amount: 34.9, currency: "BRL", billingCycle: "monthly", inDays: 20, status: "active", source: "manual" },
  { vendorName: "Zoom", category: "meetings", amount: 79.9, currency: "BRL", billingCycle: "monthly", inDays: 2, status: "active", source: "email_scan" },
  { vendorName: "Conta Azul", category: "finance", amount: 129, currency: "BRL", billingCycle: "monthly", inDays: 11, status: "active", source: "csv_upload" },
];

export function createDemoData(today: IsoDate): { organizations: Organization[]; subscriptions: Subscription[] } {
  const createdAt = `${addDays(today, -90)}T12:00:00.000Z`;
  return {
    organizations: [
      { id: DEMO_ORGANIZATION_IDS.tecnologia, name: "Exemplo Tecnologia Ltda", createdAt, defaultCurrency: "BRL", brlPerUsd: 5.4 },
      { id: DEMO_ORGANIZATION_IDS.clinica, name: "Clínica Exemplo", createdAt, defaultCurrency: "BRL", brlPerUsd: 5.4 },
    ],
    subscriptions: [
      ...toSubscriptions(DEMO_ORGANIZATION_IDS.tecnologia, TECNOLOGIA, today),
      ...toSubscriptions(DEMO_ORGANIZATION_IDS.clinica, CLINICA, today),
    ],
  };
}

function toSubscriptions(organizationId: string, items: DemoSubscription[], today: IsoDate): Subscription[] {
  return items.map(({ inDays, ...item }) => ({
    ...item,
    id: `${organizationId}-${item.vendorName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    organizationId,
    nextBillingDate: addDays(today, inDays),
  }));
}
