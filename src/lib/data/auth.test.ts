import { describe, expect, it } from "vitest";
import { createAccount, normalizeEmail, signIn, SignInError } from "./auth";
import { createRepository, ValidationError } from "./repository";
import { DEMO_CREDENTIALS, DEMO_ORGANIZATION_IDS, DEMO_USER_ID } from "./seed";

function repositorio() {
  const itens = new Map<string, string>();
  return createRepository(
    { getItem: (chave) => itens.get(chave) ?? null, setItem: (chave, valor) => void itens.set(chave, valor) },
    () => "2026-09-29",
  );
}

describe("signIn", () => {
  it("entra com a conta de demonstração e abre a sessão na primeira empresa", async () => {
    const sessao = await signIn(repositorio(), DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    expect(sessao).toEqual({ userId: DEMO_USER_ID, organizationId: DEMO_ORGANIZATION_IDS.tecnologia });
  });

  it("aceita o e-mail com maiúsculas e espaços nas pontas", async () => {
    await expect(signIn(repositorio(), "  Admin@ZeroSpend.app ", DEMO_CREDENTIALS.password)).resolves.toBeDefined();
  });

  it("dá a mesma mensagem para senha errada e para e-mail sem conta, sem abrir sessão", async () => {
    const repo = repositorio();
    await expect(signIn(repo, DEMO_CREDENTIALS.email, "senha-errada")).rejects.toThrow("E-mail ou senha incorretos.");
    await expect(signIn(repo, "pessoa@exemplo.com", DEMO_CREDENTIALS.password)).rejects.toBeInstanceOf(SignInError);
    expect(repo.getDatabase().session).toBeNull();
  });
});

describe("normalizeEmail", () => {
  it("apara e põe em minúsculas", () => {
    expect(normalizeEmail("  Pessoa@Exemplo.COM ")).toBe("pessoa@exemplo.com");
  });
});

describe("createAccount", () => {
  const conta = {
    name: "  Pessoa Exemplo ",
    email: " Pessoa@ExemploTecnologia.com.br ",
    password: "senha-de-teste",
    organizationName: " Exemplo Consultoria ",
  };

  it("cria pessoa, empresa e vínculo de administração, e entra na empresa nova", async () => {
    const repo = repositorio();
    const sessao = await createAccount(repo, conta, new Date("2026-09-29T15:00:00Z"));
    const banco = repo.getDatabase();
    const pessoa = banco.users.find((u) => u.id === sessao.userId)!;
    const empresa = banco.organizations.find((o) => o.id === sessao.organizationId)!;
    expect(pessoa).toMatchObject({ name: "Pessoa Exemplo", email: "pessoa@exemplotecnologia.com.br" });
    expect(empresa).toMatchObject({ name: "Exemplo Consultoria", defaultCurrency: "BRL", createdAt: "2026-09-29T15:00:00.000Z" });
    expect(banco.memberships).toContainEqual({ userId: pessoa.id, organizationId: empresa.id, role: "admin" });
    expect(banco.session).toEqual(sessao);
  });

  it("guarda o hash, nunca a senha, e a pessoa consegue entrar depois", async () => {
    const repo = repositorio();
    await createAccount(repo, conta);
    expect(JSON.stringify(repo.getDatabase())).not.toContain("senha-de-teste");
    repo.endSession();
    await expect(signIn(repo, "pessoa@exemplotecnologia.com.br", "senha-de-teste")).resolves.toBeDefined();
  });

  it("recusa e-mail que já tem conta e e-mail pessoal, no campo do e-mail, sem gravar", async () => {
    const repo = repositorio();
    const antes = repo.getDatabase();
    await expect(createAccount(repo, { ...conta, email: "ADMIN@zerospend.app" })).rejects.toMatchObject({
      fields: { email: "Já existe uma conta com este e-mail." },
    });
    await expect(createAccount(repo, { ...conta, email: "pessoa@gmail.com" })).rejects.toBeInstanceOf(ValidationError);
    expect(repo.getDatabase()).toBe(antes);
  });
});
