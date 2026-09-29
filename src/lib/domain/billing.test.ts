import { describe, expect, it } from "vitest";
import { convertAmount, monthlyAmount, monthlyAmountIn, nextChargeDate, totalMonthlySpend } from "./billing";
import type { Organization, Subscription } from "./types";

const empresa: Organization = {
  id: "org-1",
  name: "Exemplo Tecnologia Ltda",
  createdAt: "2026-09-01T12:00:00.000Z",
  defaultCurrency: "BRL",
  brlPerUsd: 5,
};

function assinatura(campos: Partial<Subscription>): Subscription {
  return {
    id: "sub-1",
    organizationId: "org-1",
    vendorName: "Slack",
    category: "communication",
    amount: 150,
    currency: "BRL",
    billingCycle: "monthly",
    nextBillingDate: "2026-10-05",
    status: "active",
    source: "manual",
    ...campos,
  };
}

describe("monthlyAmount", () => {
  it("mensal é o próprio valor; anual é o valor dividido por 12", () => {
    expect(monthlyAmount(assinatura({ amount: 150 }))).toBe(150);
    expect(monthlyAmount(assinatura({ amount: 1200, billingCycle: "annually" }))).toBe(100);
  });
});

describe("convertAmount", () => {
  it("converte pela cotação de reais por dólar, nos dois sentidos", () => {
    expect(convertAmount(10, "USD", "BRL", 5)).toBe(50);
    expect(convertAmount(50, "BRL", "USD", 5)).toBe(10);
    expect(convertAmount(50, "BRL", "BRL", 5)).toBe(50);
  });
});

describe("monthlyAmountIn", () => {
  it("leva o valor mensal para a moeda padrão da empresa", () => {
    const anualEmDolar = assinatura({ amount: 120, currency: "USD", billingCycle: "annually" });
    expect(monthlyAmountIn(anualEmDolar, empresa)).toBe(50);
    expect(monthlyAmountIn(anualEmDolar, { ...empresa, defaultCurrency: "USD" })).toBe(10);
  });
});

describe("totalMonthlySpend", () => {
  it("soma em moeda padrão; cancelada não conta, em revisão conta", () => {
    const assinaturas = [
      assinatura({ id: "a", amount: 150 }),
      assinatura({ id: "b", amount: 20, currency: "USD", status: "review_needed" }),
      assinatura({ id: "c", amount: 1200, billingCycle: "annually" }),
      assinatura({ id: "d", amount: 999, status: "cancelled" }),
    ];
    expect(totalMonthlySpend(assinaturas, empresa)).toBe(150 + 100 + 100);
  });

  it("é zero sem assinaturas", () => {
    expect(totalMonthlySpend([], empresa)).toBe(0);
  });
});

describe("nextChargeDate", () => {
  it("mantém a data gravada quando ela é hoje ou depois", () => {
    expect(nextChargeDate(assinatura({ nextBillingDate: "2026-10-05" }), "2026-09-29")).toBe("2026-10-05");
    expect(nextChargeDate(assinatura({ nextBillingDate: "2026-09-29" }), "2026-09-29")).toBe("2026-09-29");
  });

  it("avança a mensal que já passou até a primeira cobrança a partir de hoje", () => {
    expect(nextChargeDate(assinatura({ nextBillingDate: "2026-09-05" }), "2026-09-29")).toBe("2026-10-05");
    expect(nextChargeDate(assinatura({ nextBillingDate: "2026-06-10" }), "2026-09-29")).toBe("2026-10-10");
  });

  it("avança a anual de ano em ano", () => {
    const anual = assinatura({ billingCycle: "annually", nextBillingDate: "2025-11-10" });
    expect(nextChargeDate(anual, "2026-09-29")).toBe("2026-11-10");
  });

  it("volta ao dia-âncora depois de um mês curto", () => {
    expect(nextChargeDate(assinatura({ nextBillingDate: "2026-01-31" }), "2026-03-05")).toBe("2026-03-31");
  });
});
