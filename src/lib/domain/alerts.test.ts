import { describe, expect, it } from "vitest";
import { DEFAULT_RENEWAL_LEAD_DAYS, renewalAlerts } from "./alerts";
import type { Subscription } from "./types";

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
