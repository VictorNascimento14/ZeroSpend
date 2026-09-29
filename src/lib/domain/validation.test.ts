import { describe, expect, it } from "vitest";
import { validateAccountDraft, validateSubscriptionDraft, type SubscriptionDraft } from "./validation";

const valido: SubscriptionDraft = {
  vendorName: "Slack",
  category: "communication",
  amount: 150,
  currency: "BRL",
  billingCycle: "monthly",
  nextBillingDate: "2026-10-05",
  status: "active",
  source: "manual",
};

describe("validateSubscriptionDraft", () => {
  it("aceita um cadastro completo", () => {
    expect(validateSubscriptionDraft(valido)).toEqual({});
  });

  it("aponta cada campo inválido com a mensagem da tela", () => {
    const erros = validateSubscriptionDraft({
      ...valido,
      vendorName: "   ",
      amount: -10,
      nextBillingDate: "2026-02-30",
    });
    expect(erros).toEqual({
      vendorName: "Informe o nome do software.",
      amount: "O valor precisa ser maior que zero.",
      nextBillingDate: "Informe uma data válida.",
    });
  });

  it("aceita responsável vazio e recusa um texto longo demais", () => {
    expect(validateSubscriptionDraft({ ...valido, owner: "" })).toEqual({});
    expect(validateSubscriptionDraft({ ...valido, owner: "x".repeat(81) }).owner).toBe("Use até 80 caracteres.");
  });

  it("recusa zero, NaN e infinito como valor", () => {
    for (const amount of [0, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(validateSubscriptionDraft({ ...valido, amount }).amount).toBeDefined();
    }
  });

  it("confere em tempo de execução o que chega torto de fora (CSV, localStorage)", () => {
    const torto = { ...valido, category: "vendas", currency: "EUR", status: "paused", vendorName: undefined };
    const erros = validateSubscriptionDraft(torto as unknown as SubscriptionDraft);
    expect(Object.keys(erros).sort()).toEqual(["category", "currency", "status", "vendorName"]);
  });
});

describe("validateAccountDraft", () => {
  const conta = {
    name: "Pessoa Exemplo",
    email: "pessoa@exemplotecnologia.com.br",
    password: "senha-de-teste",
    organizationName: "Exemplo Tecnologia Ltda",
  };

  it("aceita uma conta com e-mail corporativo", () => {
    expect(validateAccountDraft(conta)).toEqual({});
  });

  it("recusa e-mail pessoal, com a explicação", () => {
    for (const email of ["pessoa@gmail.com", "pessoa@hotmail.com.br", "pessoa@icloud.com"]) {
      expect(validateAccountDraft({ ...conta, email }).email).toBe(
        "Use o e-mail da empresa — Gmail, Outlook e parecidos não valem.",
      );
    }
  });

  it("aponta nome, e-mail torto, senha curta e empresa vazia", () => {
    expect(validateAccountDraft({ name: " ", email: "pessoa@", password: "curta", organizationName: "" })).toEqual({
      name: "Informe seu nome.",
      email: "Informe um e-mail válido.",
      password: "A senha precisa de pelo menos 8 caracteres.",
      organizationName: "Informe o nome da empresa.",
    });
  });
});
