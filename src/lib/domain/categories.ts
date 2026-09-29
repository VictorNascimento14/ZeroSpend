/**
 * Lista fechada de categorias, com o rótulo da interface. É fechada porque a redundância compara
 * categorias: com texto livre, "CRM" e "Vendas" esconderiam dois CRMs pagos juntos.
 */
export const CATEGORIES = {
  communication: "Comunicação",
  meetings: "Reuniões e vídeo",
  productivity: "Produtividade",
  design: "Design",
  crm: "CRM",
  marketing: "Marketing",
  development: "Desenvolvimento",
  finance: "Financeiro",
  hr: "RH",
  storage: "Armazenamento",
  security: "Segurança",
  other: "Outros",
} as const;

export type Category = keyof typeof CATEGORIES;

export const CATEGORY_IDS = Object.keys(CATEGORIES) as Category[];

export function isCategory(value: string): value is Category {
  return Object.hasOwn(CATEGORIES, value);
}
