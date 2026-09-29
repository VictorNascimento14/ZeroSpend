import { DEFAULT_BRL_PER_USD } from "@/lib/domain/billing";
import { addDays } from "@/lib/domain/dates";
import type { IsoDate, Membership, Organization, Subscription, User } from "@/lib/domain/types";

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

export const DEMO_USER_ID = "user-admin-exemplo";

/** A conta de demonstração: admin@zerospend.app, senha "demonstracao" (aparece na tela de entrar). */
export const DEMO_CREDENTIALS = { email: "admin@zerospend.app", password: "demonstracao" } as const;

// PBKDF2 de "demonstracao" com o sal fixo "ZEROSPEND-DEMO-1" (em hex). O teste confere que batem.
const DEMO_PASSWORD_SALT = "5a45524f5350454e442d44454d4f2d31";
const DEMO_PASSWORD_HASH = "66d4fb92b4e06c72cebd792173527438e3ff413d016776d10fb2e494b70b503a";

interface DemoSubscription extends Omit<Subscription, "id" | "organizationId" | "nextBillingDate"> {
  /** Dias entre `today` e a próxima cobrança. */
  inDays: number;
}

const TECNOLOGIA: DemoSubscription[] = [
  { vendorName: "Slack", category: "communication", amount: 880, currency: "BRL", billingCycle: "monthly", inDays: 12, status: "active", source: "manual" },
  { vendorName: "Zoom", category: "meetings", amount: 159.9, currency: "BRL", billingCycle: "monthly", inDays: 5, status: "active", source: "email_scan" },
  { vendorName: "Google Workspace", category: "productivity", amount: 1176, currency: "BRL", billingCycle: "monthly", inDays: 3, status: "active", source: "manual", owner: "Admin Exemplo" },
  { vendorName: "Figma", category: "design", amount: 75, currency: "USD", billingCycle: "monthly", inDays: 18, status: "active", source: "csv_upload", owner: "Pessoa Exemplo" },
  { vendorName: "Canva", category: "design", amount: 1199, currency: "BRL", billingCycle: "annually", inDays: 40, status: "active", source: "csv_upload", owner: "Pessoa Exemplo" },
  { vendorName: "HubSpot", category: "crm", amount: 1450, currency: "BRL", billingCycle: "monthly", inDays: 9, status: "active", source: "manual", owner: "Admin Exemplo" },
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

export interface DemoData {
  organizations: Organization[];
  subscriptions: Subscription[];
  users: User[];
  memberships: Membership[];
}

export function createDemoData(today: IsoDate): DemoData {
  const createdAt = `${addDays(today, -90)}T12:00:00.000Z`;
  return {
    organizations: [
      { id: DEMO_ORGANIZATION_IDS.tecnologia, name: "Exemplo Tecnologia Ltda", createdAt, defaultCurrency: "BRL", brlPerUsd: DEFAULT_BRL_PER_USD },
      { id: DEMO_ORGANIZATION_IDS.clinica, name: "Clínica Exemplo", createdAt, defaultCurrency: "BRL", brlPerUsd: DEFAULT_BRL_PER_USD },
    ],
    subscriptions: [
      ...toSubscriptions(DEMO_ORGANIZATION_IDS.tecnologia, TECNOLOGIA, today),
      ...toSubscriptions(DEMO_ORGANIZATION_IDS.clinica, CLINICA, today),
    ],
    users: [
      {
        id: DEMO_USER_ID,
        name: "Admin Exemplo",
        email: DEMO_CREDENTIALS.email,
        passwordHash: DEMO_PASSWORD_HASH,
        passwordSalt: DEMO_PASSWORD_SALT,
      },
    ],
    // O BPO do briefing: a mesma pessoa administra as duas empresas.
    memberships: [
      { userId: DEMO_USER_ID, organizationId: DEMO_ORGANIZATION_IDS.tecnologia, role: "admin" },
      { userId: DEMO_USER_ID, organizationId: DEMO_ORGANIZATION_IDS.clinica, role: "admin" },
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
