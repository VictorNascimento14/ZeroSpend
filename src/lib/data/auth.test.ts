import { describe, expect, it } from "vitest";
import { normalizeEmail, signIn, SignInError } from "./auth";
import { createRepository } from "./repository";
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
