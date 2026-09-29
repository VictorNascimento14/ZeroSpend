import { describe, expect, it } from "vitest";
import { findRedundancies, potentialMonthlySavings, redundantIds } from "./redundancy";
import type { Organization, Subscription } from "./types";

const empresa: Organization = {
  id: "org-1",
  name: "Exemplo Tecnologia Ltda",
  createdAt: "2026-09-01T12:00:00.000Z",
  defaultCurrency: "BRL",
  brlPerUsd: 5,
};

function assinatura(vendorName: string, campos: Partial<Subscription>): Subscription {
  return {
    id: vendorName.toLowerCase(),
    organizationId: "org-1",
    vendorName,
    category: "crm",
    amount: 100,
    currency: "BRL",
    billingCycle: "monthly",
    nextBillingDate: "2026-10-05",
    status: "active",
    source: "manual",
    ...campos,
  };
}

describe("findRedundancies", () => {
  it("agrupa duas ou mais assinaturas da mesma categoria; categoria com uma só não entra", () => {
    const grupos = findRedundancies(
      [
        assinatura("HubSpot", { category: "crm" }),
        assinatura("Pipedrive", { category: "crm" }),
        assinatura("Slack", { category: "communication" }),
      ],
      empresa,
    );
    expect(grupos.map((g) => [g.category, g.subscriptions.map((s) => s.vendorName)])).toEqual([
      ["crm", ["HubSpot", "Pipedrive"]],
    ]);
  });

  it("ignora a cancelada e a categoria Outros; conta a que está em revisão", () => {
    const grupos = findRedundancies(
      [
        assinatura("HubSpot", {}),
        assinatura("Pipedrive", { status: "cancelled" }),
        assinatura("ChatGPT", { category: "other" }),
        assinatura("Acrobat", { category: "other" }),
        assinatura("Figma", { category: "design" }),
        assinatura("Canva", { category: "design", status: "review_needed" }),
      ],
      empresa,
    );
    expect(grupos.map((g) => g.category)).toEqual(["design"]);
  });

  it("mantém a mais cara e economiza o resto, na moeda padrão (mensal equivalente)", () => {
    const [grupo] = findRedundancies(
      [
        assinatura("Canva", { category: "design", amount: 1200, billingCycle: "annually" }),
        assinatura("Figma", { category: "design", amount: 75, currency: "USD" }),
        assinatura("Miro", { category: "design", amount: 60 }),
      ],
      empresa,
    );
    expect(grupo.subscriptions.map((s) => s.vendorName)).toEqual(["Figma", "Canva", "Miro"]);
    expect(grupo.monthlySavings).toBe(100 + 60);
  });

  it("ordena os grupos pela economia, a maior primeiro, e desempata pelo nome", () => {
    const grupos = findRedundancies(
      [
        assinatura("B-design", { category: "design", amount: 50 }),
        assinatura("A-design", { category: "design", amount: 50 }),
        assinatura("HubSpot", { category: "crm", amount: 900 }),
        assinatura("Pipedrive", { category: "crm", amount: 400 }),
      ],
      empresa,
    );
    expect(grupos.map((g) => g.category)).toEqual(["crm", "design"]);
    expect(grupos[1].subscriptions.map((s) => s.vendorName)).toEqual(["A-design", "B-design"]);
  });

  it("soma a economia potencial e marca todos os ids redundantes", () => {
    const grupos = findRedundancies(
      [
        assinatura("HubSpot", { amount: 900 }),
        assinatura("Pipedrive", { amount: 400 }),
        assinatura("Figma", { category: "design", amount: 300 }),
        assinatura("Canva", { category: "design", amount: 50 }),
      ],
      empresa,
    );
    expect(potentialMonthlySavings(grupos)).toBe(400 + 50);
    expect(redundantIds(grupos)).toEqual(new Set(["hubspot", "pipedrive", "figma", "canva"]));
  });

  it("não acha nada numa lista vazia", () => {
    expect(findRedundancies([], empresa)).toEqual([]);
    expect(potentialMonthlySavings([])).toBe(0);
  });
});
