import { describe, expect, it } from "vitest";
import { validateSubscriptionDraft } from "@/lib/domain/validation";
import { readSubscriptionForm } from "./subscription-form";

function formulario(campos: Record<string, string>) {
  const form = new FormData();
  for (const [nome, valor] of Object.entries(campos)) form.set(nome, valor);
  return form;
}

describe("readSubscriptionForm", () => {
  it("converte o formulário num rascunho válido", () => {
    const rascunho = readSubscriptionForm(
      formulario({
        vendorName: "  Miro ",
        category: "design",
        amount: "48.5",
        currency: "USD",
        billingCycle: "monthly",
        nextBillingDate: "2026-10-20",
      }),
      { status: "active", source: "manual" },
    );
    expect(rascunho).toEqual({
      vendorName: "Miro",
      category: "design",
      amount: 48.5,
      currency: "USD",
      billingCycle: "monthly",
      nextBillingDate: "2026-10-20",
      status: "active",
      source: "manual",
      owner: "",
    });
    expect(validateSubscriptionDraft(rascunho)).toEqual({});
  });

  it("deixa o valor vazio inválido, para a validação apontar o campo", () => {
    const rascunho = readSubscriptionForm(formulario({ amount: "" }), { status: "active", source: "manual" });
    expect(Number.isNaN(rascunho.amount)).toBe(true);
    expect(Object.keys(validateSubscriptionDraft(rascunho)).sort()).toEqual([
      "amount",
      "billingCycle",
      "category",
      "currency",
      "nextBillingDate",
      "vendorName",
    ]);
  });

  it("na edição, lê o status e o responsável do formulário e mantém a origem", () => {
    const rascunho = readSubscriptionForm(formulario({ status: "cancelled", owner: " Pessoa Exemplo " }), {
      status: "active",
      source: "csv_upload",
    });
    expect(rascunho).toMatchObject({ status: "cancelled", owner: "Pessoa Exemplo", source: "csv_upload" });
  });
});
