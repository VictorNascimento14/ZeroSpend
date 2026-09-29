import { describe, expect, it, vi } from "vitest";
import type { SubscriptionDraft } from "@/lib/domain/validation";
import { BACKUP_KEY, createRepository, STORAGE_KEY, ValidationError } from "./repository";
import { DEMO_ORGANIZATION_IDS } from "./seed";

function memoria(inicial: Record<string, string> = {}) {
  const itens = new Map(Object.entries(inicial));
  return {
    itens,
    getItem: (chave: string) => itens.get(chave) ?? null,
    setItem: (chave: string, valor: string) => void itens.set(chave, valor),
  };
}

const hoje = () => "2026-09-29";
const empresa = DEMO_ORGANIZATION_IDS.tecnologia;
const rascunho: SubscriptionDraft = {
  vendorName: "  Miro  ",
  category: "design",
  amount: 48,
  currency: "USD",
  billingCycle: "monthly",
  nextBillingDate: "2026-10-20",
  status: "active",
  source: "manual",
};

describe("leitura", () => {
  it("semeia a demonstração num navegador vazio e grava", () => {
    const armazenamento = memoria();
    const banco = createRepository(armazenamento, hoje).getDatabase();
    expect(banco.organizations.map((o) => o.name)).toEqual(["Exemplo Tecnologia Ltda", "Clínica Exemplo"]);
    expect(JSON.parse(armazenamento.itens.get(STORAGE_KEY)!)).toEqual(banco);
  });

  it("lê o que já está gravado, sem semear de novo", () => {
    const armazenamento = memoria();
    createRepository(armazenamento, hoje).addSubscription(empresa, rascunho);
    const outro = createRepository(armazenamento, () => "2030-01-01").getDatabase();
    expect(outro.subscriptions.some((s) => s.vendorName === "Miro")).toBe(true);
  });

  it("devolve a mesma referência até alguém gravar (exigência do useSyncExternalStore)", () => {
    const repositorio = createRepository(memoria(), hoje);
    const antes = repositorio.getDatabase();
    expect(repositorio.getDatabase()).toBe(antes);
    repositorio.addSubscription(empresa, rascunho);
    expect(repositorio.getDatabase()).not.toBe(antes);
  });

  it.each([
    ["JSON quebrado", "{nao-e-json"],
    ["versão desconhecida", JSON.stringify({ version: 2, organizations: [], subscriptions: [] })],
  ])("guarda o conteúdo ilegível (%s) no backup antes de semear", (_, conteudo) => {
    const armazenamento = memoria({ [STORAGE_KEY]: conteudo });
    const banco = createRepository(armazenamento, hoje).getDatabase();
    expect(armazenamento.itens.get(BACKUP_KEY)).toBe(conteudo);
    expect(banco.organizations).toHaveLength(2);
  });
});

describe("escrita", () => {
  it("cria com id novo, nome aparado e só os campos do modelo, e avisa quem assina", () => {
    const repositorio = createRepository(memoria(), hoje);
    const aviso = vi.fn();
    repositorio.subscribe(aviso);
    const criada = repositorio.addSubscription(empresa, { ...rascunho, extra: "fora do modelo" } as SubscriptionDraft);
    expect(criada.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(criada.vendorName).toBe("Miro");
    expect(criada).not.toHaveProperty("extra");
    expect(repositorio.getDatabase().subscriptions).toContainEqual(criada);
    expect(aviso).toHaveBeenCalledOnce();
  });

  it("recusa cadastro inválido com o erro de cada campo, sem gravar", () => {
    const armazenamento = memoria();
    const repositorio = createRepository(armazenamento, hoje);
    const antes = armazenamento.itens.get(STORAGE_KEY) ?? JSON.stringify(repositorio.getDatabase());
    let erro: unknown;
    try {
      repositorio.addSubscription(empresa, { ...rascunho, amount: 0 });
    } catch (e) {
      erro = e;
    }
    expect(erro).toBeInstanceOf(ValidationError);
    expect((erro as ValidationError).fields).toEqual({ amount: "O valor precisa ser maior que zero." });
    expect(armazenamento.itens.get(STORAGE_KEY)).toBe(antes);
  });

  it("recusa empresa que não existe", () => {
    expect(() => createRepository(memoria(), hoje).addSubscription("org-inexistente", rascunho)).toThrow(
      "Empresa não encontrada.",
    );
  });

  it("edita validando o resultado da mistura, e mantém id e empresa", () => {
    const repositorio = createRepository(memoria(), hoje);
    const slack = `${empresa}-slack`;
    const editada = repositorio.updateSubscription(slack, { amount: 990, billingCycle: "annually" });
    expect(editada).toMatchObject({ id: slack, organizationId: empresa, amount: 990, billingCycle: "annually" });
    expect(() => repositorio.updateSubscription(slack, { nextBillingDate: "ontem" })).toThrow(ValidationError);
    expect(() => repositorio.updateSubscription("nao-existe", { amount: 1 })).toThrow("Assinatura não encontrada.");
  });

  it("remove e devolve a removida, para o desfazer", () => {
    const repositorio = createRepository(memoria(), hoje);
    const removida = repositorio.removeSubscription(`${empresa}-dropbox`);
    expect(removida.vendorName).toBe("Dropbox");
    expect(repositorio.getDatabase().subscriptions.some((s) => s.id === removida.id)).toBe(false);
  });

  it("não muda nada se o armazenamento recusar a gravação", () => {
    const armazenamento = memoria();
    const repositorio = createRepository(armazenamento, hoje);
    const antes = repositorio.getDatabase();
    armazenamento.setItem = () => {
      throw new DOMException("cota cheia", "QuotaExceededError");
    };
    expect(() => repositorio.addSubscription(empresa, rascunho)).toThrow("cota cheia");
    expect(repositorio.getDatabase()).toBe(antes);
  });
});

describe("id de assinatura nova", () => {
  it("é gerado mesmo sem crypto.randomUUID (navegador fora de contexto seguro)", () => {
    const randomUUID = crypto.randomUUID;
    try {
      Object.defineProperty(crypto, "randomUUID", { value: undefined, configurable: true });
      const criada = createRepository(memoria(), hoje).addSubscription(empresa, rascunho);
      expect(criada.id).toMatch(/^[0-9a-f]{32}$/);
    } finally {
      Object.defineProperty(crypto, "randomUUID", { value: randomUUID, configurable: true });
    }
  });
});
