import { describe, expect, it } from "vitest";
import { computeKpis } from "./kpis";
import type { Organization, Subscription } from "./types";

const empresa: Organization = {
  id: "org-1",
  name: "Exemplo Tecnologia Ltda",
  createdAt: "2026-09-01T12:00:00.000Z",
  defaultCurrency: "BRL",
  brlPerUsd: 5,
  renewalLeadDays: 7,
  alertChannels: { email: true, whatsapp: false },
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

describe("computeKpis", () => {
  it("junta gasto, economia, contagens e renovações da empresa", () => {
    const kpis = computeKpis(
      [
        assinatura("HubSpot", { category: "crm", amount: 900 }),
        assinatura("Pipedrive", { category: "crm", amount: 20, currency: "USD", status: "review_needed" }),
        assinatura("Zoom", { category: "meetings", amount: 60, nextBillingDate: "2026-10-02" }),
        assinatura("Dropbox", { category: "storage", amount: 50, status: "cancelled", nextBillingDate: "2026-09-30" }),
      ],
      empresa,
      "2026-09-29",
    );
    expect(kpis).toMatchObject({
      monthlySpend: 900 + 100 + 60,
      convertedCurrency: true,
      potentialSavings: 100,
      redundantToCut: 1,
      activeCount: 2,
      reviewCount: 1,
      leadDays: 7,
    });
    expect(kpis.renewals.map((r) => r.subscription.vendorName)).toEqual(["Zoom"]);
  });

  it("não marca conversão quando tudo está na moeda da empresa, nem conta a cancelada em outra moeda", () => {
    const kpis = computeKpis([assinatura("A"), assinatura("B", { currency: "USD", status: "cancelled" })], empresa, "2026-09-29");
    expect(kpis.convertedCurrency).toBe(false);
  });

  it("conta as renovações pela antecedência da empresa", () => {
    const perto = assinatura("Perto", { nextBillingDate: "2026-10-01" });
    const longe = assinatura("Longe", { nextBillingDate: "2026-10-20" });
    expect(computeKpis([perto, longe], empresa, "2026-09-29")).toMatchObject({ leadDays: 7, renewals: [{ subscription: perto }] });
    const com30 = computeKpis([perto, longe], { ...empresa, renewalLeadDays: 30 }, "2026-09-29");
    expect(com30.leadDays).toBe(30);
    expect(com30.renewals.map((renovacao) => renovacao.subscription.vendorName)).toEqual(["Perto", "Longe"]);
  });

  it("dá zero para empresa sem assinaturas", () => {
    expect(computeKpis([], empresa, "2026-09-29")).toMatchObject({
      monthlySpend: 0,
      potentialSavings: 0,
      redundantToCut: 0,
      activeCount: 0,
      reviewCount: 0,
      renewals: [],
    });
  });
});
