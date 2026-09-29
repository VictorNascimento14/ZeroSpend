import type { Category } from "@/lib/domain/categories";
import { toWords } from "@/lib/domain/text";

/** Famílias do kit para o monograma do fornecedor (nunca o logotipo dele). */
export type VendorTone = "cerulean" | "raspberry" | "plum" | "success" | "warning";

export interface KnownVendor {
  name: string;
  category: Category;
  /** Como o nome aparece na descrição do extrato, em palavras (ver `toWords`). */
  patterns: string[];
  tone: VendorTone;
}

/**
 * O catálogo local de fornecedores de SaaS — a v1 reconhece por aqui, não por IA (especificação).
 * O mais específico vem antes: "google workspace" antes de qualquer coisa "google".
 */
export const KNOWN_VENDORS: KnownVendor[] = [
  { name: "Google Workspace", category: "productivity", patterns: ["google workspace", "google gsuite", "gsuite"], tone: "raspberry" },
  { name: "Microsoft 365", category: "productivity", patterns: ["microsoft 365", "microsoft office", "msft 365", "office 365"], tone: "cerulean" },
  { name: "Notion", category: "productivity", patterns: ["notion"], tone: "plum" },
  { name: "Slack", category: "communication", patterns: ["slack"], tone: "plum" },
  { name: "Zoom", category: "meetings", patterns: ["zoom us", "zoom video", "zoom"], tone: "cerulean" },
  { name: "Loom", category: "meetings", patterns: ["loom"], tone: "plum" },
  { name: "Calendly", category: "meetings", patterns: ["calendly"], tone: "cerulean" },
  { name: "Figma", category: "design", patterns: ["figma"], tone: "warning" },
  { name: "Canva", category: "design", patterns: ["canva"], tone: "cerulean" },
  { name: "Adobe Creative Cloud", category: "design", patterns: ["adobe creative", "creative cloud"], tone: "raspberry" },
  { name: "Adobe Acrobat Pro", category: "other", patterns: ["adobe acrobat", "acrobat"], tone: "raspberry" },
  { name: "Miro", category: "design", patterns: ["miro com", "miro"], tone: "warning" },
  { name: "HubSpot", category: "crm", patterns: ["hubspot"], tone: "warning" },
  { name: "Pipedrive", category: "crm", patterns: ["pipedrive"], tone: "success" },
  { name: "Salesforce", category: "crm", patterns: ["salesforce"], tone: "cerulean" },
  { name: "RD Station", category: "marketing", patterns: ["rd station", "rdstation"], tone: "success" },
  { name: "Mailchimp", category: "marketing", patterns: ["mailchimp", "intuit mailchimp"], tone: "warning" },
  { name: "GitHub", category: "development", patterns: ["github"], tone: "plum" },
  { name: "Atlassian", category: "development", patterns: ["atlassian", "jira", "confluence"], tone: "cerulean" },
  { name: "Vercel", category: "development", patterns: ["vercel"], tone: "plum" },
  { name: "Amazon Web Services", category: "development", patterns: ["amazon web services", "aws"], tone: "warning" },
  { name: "Conta Azul", category: "finance", patterns: ["conta azul", "contaazul"], tone: "cerulean" },
  { name: "Omie", category: "finance", patterns: ["omie"], tone: "success" },
  { name: "Gupy", category: "hr", patterns: ["gupy"], tone: "success" },
  { name: "Dropbox", category: "storage", patterns: ["dropbox"], tone: "cerulean" },
  { name: "1Password", category: "security", patterns: ["1password"], tone: "plum" },
  { name: "ChatGPT Team", category: "other", patterns: ["chatgpt", "openai"], tone: "success" },
  { name: "Zendesk", category: "communication", patterns: ["zendesk"], tone: "success" },
  { name: "Asana", category: "productivity", patterns: ["asana"], tone: "raspberry" },
  { name: "Trello", category: "productivity", patterns: ["trello"], tone: "cerulean" },
];

/** O fornecedor conhecido na descrição do extrato, casando palavras inteiras ("zoom" não casa "zoomcar"). */
export function recognizeVendor(description: string): KnownVendor | null {
  const words = ` ${toWords(description)} `;
  return KNOWN_VENDORS.find((vendor) => vendor.patterns.some((pattern) => words.includes(` ${pattern} `))) ?? null;
}

/** O fornecedor do catálogo pelo nome exato (a cor do monograma dos conhecidos). */
export function knownVendorByName(name: string): KnownVendor | null {
  const key = toWords(name);
  return KNOWN_VENDORS.find((vendor) => toWords(vendor.name) === key) ?? null;
}
