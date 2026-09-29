import { describe, expect, it, vi } from "vitest";
import type { SubscriptionDraft } from "@/lib/domain/validation";
import { BACKUP_KEY, createRepository, currentSession, STORAGE_KEY, ValidationError } from "./repository";
import { DEMO_ORGANIZATION_IDS, DEMO_USER_ID } from "./seed";

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
    expect(banco.users.map((u) => u.email)).toEqual(["admin@zerospend.app"]);
    expect(banco.session).toBeNull();
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
    ["versão desconhecida", JSON.stringify({ version: 3, organizations: [], subscriptions: [] })],
    ["formato da v1, sem usuários", JSON.stringify({ version: 1, organizations: [], subscriptions: [] })],
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

  it("grava o responsável aparado e deixa de fora o vazio", () => {
    const repositorio = createRepository(memoria(), hoje);
    expect(repositorio.addSubscription(empresa, { ...rascunho, owner: "  Pessoa Exemplo " }).owner).toBe("Pessoa Exemplo");
    expect(repositorio.addSubscription(empresa, { ...rascunho, owner: "   " })).not.toHaveProperty("owner");
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

  it("desfaz a exclusão com o mesmo id, uma vez só", () => {
    const repositorio = createRepository(memoria(), hoje);
    const removida = repositorio.removeSubscription(`${empresa}-slack`);
    expect(repositorio.restoreSubscription(removida)).toEqual(removida);
    expect(repositorio.getDatabase().subscriptions.filter((s) => s.id === removida.id)).toHaveLength(1);
    expect(() => repositorio.restoreSubscription(removida)).toThrow("Esta assinatura já está na lista.");
    expect(() => repositorio.restoreSubscription({ ...removida, id: "outro", organizationId: "sumiu" })).toThrow(
      "Empresa não encontrada.",
    );
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

describe("sessão", () => {
  it("abre na primeira empresa da pessoa, resolve e fecha", () => {
    const repositorio = createRepository(memoria(), hoje);
    expect(currentSession(repositorio.getDatabase())).toBeNull();

    expect(repositorio.startSession(DEMO_USER_ID)).toEqual({ userId: DEMO_USER_ID, organizationId: empresa });
    const sessao = currentSession(repositorio.getDatabase());
    expect(sessao?.user.name).toBe("Admin Exemplo");
    expect(sessao?.organization.name).toBe("Exemplo Tecnologia Ltda");
    expect(sessao?.role).toBe("admin");

    repositorio.endSession();
    expect(currentSession(repositorio.getDatabase())).toBeNull();
  });

  it("recusa abrir sessão para quem não tem empresa", () => {
    expect(() => createRepository(memoria(), hoje).startSession("ninguem")).toThrow("Esta conta não tem empresa.");
  });

  it("não resolve sessão que aponta para o que não existe mais", () => {
    const repositorio = createRepository(memoria(), hoje);
    repositorio.startSession(DEMO_USER_ID);
    const banco = repositorio.getDatabase();
    expect(currentSession({ ...banco, memberships: [] })).toBeNull();
    expect(currentSession({ ...banco, users: [] })).toBeNull();
  });
});

describe("empresas da sessão", () => {
  it("lista as empresas da pessoa em ordem alfabética", () => {
    const repositorio = createRepository(memoria(), hoje);
    repositorio.startSession(DEMO_USER_ID);
    expect(currentSession(repositorio.getDatabase())?.organizations.map((o) => o.name)).toEqual([
      "Clínica Exemplo",
      "Exemplo Tecnologia Ltda",
    ]);
  });

  it("troca de empresa só para uma em que a pessoa tem vínculo", () => {
    const repositorio = createRepository(memoria(), hoje);
    expect(() => repositorio.selectOrganization(DEMO_ORGANIZATION_IDS.clinica)).toThrow("Ninguém entrou.");
    repositorio.startSession(DEMO_USER_ID);
    repositorio.selectOrganization(DEMO_ORGANIZATION_IDS.clinica);
    expect(currentSession(repositorio.getDatabase())?.organization.name).toBe("Clínica Exemplo");
    expect(() => repositorio.selectOrganization("org-de-outra-pessoa")).toThrow("Você não tem acesso a esta empresa.");
  });

  it("cria empresa nova com vínculo de administração e entra nela", () => {
    const repositorio = createRepository(memoria(), hoje);
    repositorio.startSession(DEMO_USER_ID);
    const nova = repositorio.addOrganization("  Exemplo Filial  ", new Date("2026-09-29T15:00:00Z"));
    expect(nova).toMatchObject({ name: "Exemplo Filial", defaultCurrency: "BRL", brlPerUsd: 5.4 });
    const sessao = currentSession(repositorio.getDatabase());
    expect(sessao?.organization.id).toBe(nova.id);
    expect(sessao?.role).toBe("admin");
    expect(sessao?.organizations).toHaveLength(3);
  });

  it("recusa empresa sem nome, no campo do nome", () => {
    const repositorio = createRepository(memoria(), hoje);
    repositorio.startSession(DEMO_USER_ID);
    expect(() => repositorio.addOrganization("   ")).toThrow(ValidationError);
  });
});
