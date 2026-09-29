import { describe, expect, it } from "vitest";
import { renewalAlerts } from "@/lib/domain/alerts";
import { totalMonthlySpend } from "@/lib/domain/billing";
import { isCategory } from "@/lib/domain/categories";
import { isIsoDate } from "@/lib/domain/dates";
import { createDemoData, DEMO_ORGANIZATION_IDS } from "./seed";

const today = "2026-09-29";
const { organizations, subscriptions } = createDemoData(today);
const daEmpresa = (id: string) => subscriptions.filter((s) => s.organizationId === id);

describe("dados de demonstração", () => {
  it("só têm assinaturas válidas, de empresas que existem, com id único", () => {
    const empresas = new Set(organizations.map((o) => o.id));
    expect(new Set(subscriptions.map((s) => s.id)).size).toBe(subscriptions.length);
    for (const s of subscriptions) {
      expect(empresas.has(s.organizationId)).toBe(true);
      expect(isIsoDate(s.nextBillingDate)).toBe(true);
      expect(isCategory(s.category)).toBe(true);
      expect(s.amount).toBeGreaterThan(0);
    }
  });

  it("marcam as datas a partir de hoje: o Zoom renova em 5 dias", () => {
    const zoom = subscriptions.find((s) => s.id === `${DEMO_ORGANIZATION_IDS.tecnologia}-zoom`);
    expect(zoom?.nextBillingDate).toBe("2026-10-04");
  });

  it("exercitam cada regra na Exemplo Tecnologia", () => {
    const tecnologia = daEmpresa(DEMO_ORGANIZATION_IDS.tecnologia);
    const status = new Set(tecnologia.map((s) => s.status));
    expect(status).toEqual(new Set(["active", "review_needed", "cancelled"]));
    expect(tecnologia.some((s) => s.currency === "USD")).toBe(true);
    expect(tecnologia.some((s) => s.billingCycle === "annually")).toBe(true);

    const porCategoria = new Map<string, number>();
    for (const s of tecnologia.filter((s) => s.status !== "cancelled" && s.category !== "other")) {
      porCategoria.set(s.category, (porCategoria.get(s.category) ?? 0) + 1);
    }
    const repetidas = [...porCategoria].filter(([, n]) => n > 1).map(([c]) => c);
    expect(repetidas.sort()).toEqual(["crm", "design"]);
  });

  it("dão três alertas de renovação na Exemplo Tecnologia, como no briefing", () => {
    const alertas = renewalAlerts(daEmpresa(DEMO_ORGANIZATION_IDS.tecnologia), today);
    expect(alertas.map((a) => [a.subscription.vendorName, a.daysUntil])).toEqual([
      ["GitHub", 2],
      ["Google Workspace", 3],
      ["Zoom", 5],
    ]);
  });

  it("dão um gasto mensal conhecido na Exemplo Tecnologia (cotação de R$ 5,40)", () => {
    const tecnologia = organizations.find((o) => o.id === DEMO_ORGANIZATION_IDS.tecnologia)!;
    expect(totalMonthlySpend(daEmpresa(tecnologia.id), tecnologia)).toBeCloseTo(7444.75, 2);
  });
});
