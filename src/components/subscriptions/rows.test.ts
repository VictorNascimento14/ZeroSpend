import { describe, expect, it } from "vitest";
import type { Organization, Subscription } from "@/lib/domain/types";
import { buildRows, filterRows, sortRows } from "./rows";

const empresa: Organization = {
  id: "org-1",
  name: "Exemplo Tecnologia Ltda",
  createdAt: "2026-09-01T12:00:00.000Z",
  defaultCurrency: "BRL",
  brlPerUsd: 5,
};

function assinatura(vendorName: string, campos: Partial<Subscription> = {}): Subscription {
  return {
    id: vendorName,
    organizationId: "org-1",
    vendorName,
    category: "other",
    amount: 100,
    currency: "BRL",
    billingCycle: "monthly",
    nextBillingDate: "2026-10-20",
    status: "active",
    source: "manual",
    ...campos,
  };
}

describe("buildRows", () => {
  it("ordena pela próxima cobrança, com as canceladas no fim por nome", () => {
    const linhas = buildRows(
      [
        assinatura("Zeta", { status: "cancelled" }),
        assinatura("Tarde", { nextBillingDate: "2026-11-01" }),
        assinatura("Alfa", { status: "cancelled" }),
        assinatura("Cedo", { nextBillingDate: "2026-10-01" }),
      ],
      empresa,
      "2026-09-29",
    );
    expect(linhas.map((l) => l.subscription.vendorName)).toEqual(["Cedo", "Tarde", "Alfa", "Zeta"]);
    expect(linhas.map((l) => l.daysUntil)).toEqual([2, 33, null, null]);
  });

  it("calcula o valor por mês na moeda da empresa e marca as redundantes", () => {
    const linhas = buildRows(
      [
        assinatura("Figma", { category: "design", amount: 75, currency: "USD" }),
        assinatura("Canva", { category: "design", amount: 1200, billingCycle: "annually" }),
        assinatura("Slack", { category: "communication" }),
      ],
      empresa,
      "2026-09-29",
    );
    const por = Object.fromEntries(linhas.map((l) => [l.subscription.vendorName, l]));
    expect(por.Figma).toMatchObject({ monthlyAmount: 375, redundant: true });
    expect(por.Canva).toMatchObject({ monthlyAmount: 100, redundant: true });
    expect(por.Slack.redundant).toBe(false);
  });
});

describe("filterRows e sortRows", () => {
  const linhas = buildRows(
    [
      assinatura("Figma", { category: "design", amount: 75, currency: "USD", owner: "Pessoa Exemplo" }),
      assinatura("Canva", { category: "design", amount: 1200, billingCycle: "annually" }),
      assinatura("Clínica App", { category: "other", amount: 30, status: "review_needed" }),
      assinatura("Dropbox", { category: "storage", amount: 50, status: "cancelled" }),
    ],
    empresa,
    "2026-09-29",
  );
  const todos = { query: "", status: "all" as const, category: "all" as const };
  const nomes = (l: typeof linhas) => l.map((x) => x.subscription.vendorName);

  it("busca por software, categoria e responsável, sem acento nem maiúscula", () => {
    expect(nomes(filterRows(linhas, { ...todos, query: "clinica" }))).toEqual(["Clínica App"]);
    expect(nomes(filterRows(linhas, { ...todos, query: "DESIGN" })).sort()).toEqual(["Canva", "Figma"]);
    expect(nomes(filterRows(linhas, { ...todos, query: "pessoa" }))).toEqual(["Figma"]);
  });

  it("filtra por status, pelo sinal de redundância e por categoria", () => {
    expect(nomes(filterRows(linhas, { ...todos, status: "cancelled" }))).toEqual(["Dropbox"]);
    expect(nomes(filterRows(linhas, { ...todos, status: "redundant" })).sort()).toEqual(["Canva", "Figma"]);
    expect(nomes(filterRows(linhas, { ...todos, category: "storage" }))).toEqual(["Dropbox"]);
  });

  it("ordena por maior valor por mês e por nome", () => {
    expect(nomes(sortRows(linhas, "monthlyAmount"))).toEqual(["Figma", "Canva", "Dropbox", "Clínica App"]);
    expect(nomes(sortRows(linhas, "name"))).toEqual(["Canva", "Clínica App", "Dropbox", "Figma"]);
  });
});
