import { describe, expect, it } from "vitest";
import { currentAlerts, DEFAULT_RENEWAL_LEAD_DAYS, renewalAlerts } from "./alerts";
import type { Organization, Subscription } from "./types";

const hoje = "2026-09-29";

function assinatura(id: string, nextBillingDate: string, campos: Partial<Subscription> = {}): Subscription {
  return {
    id,
    organizationId: "org-1",
    vendorName: id,
    category: "other",
    amount: 100,
    currency: "BRL",
    billingCycle: "monthly",
    nextBillingDate,
    status: "active",
    source: "manual",
    ...campos,
  };
}

describe("renewalAlerts", () => {
  it("avisa de hoje até a antecedência, com as duas pontas, da mais próxima para a mais distante", () => {
    const alertas = renewalAlerts(
      [
        assinatura("em-7", "2026-10-06"),
        assinatura("hoje", "2026-09-29"),
        assinatura("em-8", "2026-10-07"),
        assinatura("em-3", "2026-10-02"),
      ],
      hoje,
    );
    expect(alertas.map((a) => [a.subscription.id, a.daysUntil])).toEqual([
      ["hoje", 0],
      ["em-3", 3],
      ["em-7", 7],
    ]);
  });

  it("ignora a cancelada e avisa a que está em revisão", () => {
    const alertas = renewalAlerts(
      [
        assinatura("cancelada", "2026-10-01", { status: "cancelled" }),
        assinatura("revisao", "2026-10-01", { status: "review_needed" }),
      ],
      hoje,
    );
    expect(alertas.map((a) => a.subscription.id)).toEqual(["revisao"]);
  });

  it("usa a próxima cobrança efetiva: a data gravada que passou avança pelo ciclo", () => {
    const [alerta] = renewalAlerts([assinatura("vencida", "2026-09-02")], hoje);
    expect(alerta).toMatchObject({ chargeDate: "2026-10-02", daysUntil: 3 });
  });

  it("respeita a antecedência pedida", () => {
    const assinaturas = [assinatura("em-2", "2026-10-01"), assinatura("em-5", "2026-10-04")];
    expect(renewalAlerts(assinaturas, hoje, 3).map((a) => a.subscription.id)).toEqual(["em-2"]);
    expect(DEFAULT_RENEWAL_LEAD_DAYS).toBe(7);
  });
});

describe("currentAlerts", () => {
  const empresa: Organization = {
    id: "org-1",
    name: "Empresa",
    createdAt: "2026-01-01T12:00:00.000Z",
    defaultCurrency: "BRL",
    brlPerUsd: 5.4,
    renewalLeadDays: 7,
    alertChannels: { email: true, whatsapp: false },
  };

  it("dá a cada situação uma chave: a renovação leva a data, e a duplicidade, quem está no grupo", () => {
    const zoom = assinatura("zoom", "2026-10-02", { category: "meetings", amount: 80 });
    const meet = assinatura("meet", "2026-11-20", { category: "meetings", amount: 50 });
    expect(currentAlerts([zoom, meet], empresa, hoje).map((alerta) => alerta.key)).toEqual([
      "renovacao:zoom:2026-10-02",
      "redundancia:meetings:meet,zoom",
    ]);
    // Um mês depois, a cobrança é outra; e uma terceira ferramenta na categoria muda o grupo.
    const loom = assinatura("loom", "2026-12-01", { category: "meetings", amount: 30 });
    expect(currentAlerts([zoom, meet, loom], empresa, "2026-10-29").map((alerta) => alerta.key)).toEqual([
      "renovacao:zoom:2026-11-02",
      "redundancia:meetings:loom,meet,zoom",
    ]);
  });
});

describe("currentAlerts com a antecedência da empresa", () => {
  it("avisa só o que cabe na antecedência escolhida", () => {
    const empresa3dias: Organization = {
      id: "org-1",
      name: "Empresa",
      createdAt: "2026-01-01T12:00:00.000Z",
      defaultCurrency: "BRL",
      brlPerUsd: 5.4,
      renewalLeadDays: 3,
      alertChannels: { email: true, whatsapp: false },
    };
    const alertas = currentAlerts([assinatura("em-3", "2026-10-02"), assinatura("em-5", "2026-10-04")], empresa3dias, hoje);
    expect(alertas.map((alerta) => alerta.key)).toEqual(["renovacao:em-3:2026-10-02"]);
  });
});
