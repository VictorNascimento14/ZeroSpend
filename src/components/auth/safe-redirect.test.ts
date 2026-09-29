import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it("aceita caminho interno, com busca", () => {
    expect(safeRedirectPath("/assinaturas")).toBe("/assinaturas");
    expect(safeRedirectPath("/alertas?aba=renovacao")).toBe("/alertas?aba=renovacao");
  });

  it.each([["//site.com"], ["/\\site.com"], ["https://site.com"], ["site.com"], ["/entrar"], [""], [undefined]])(
    "recusa %j e volta para o dashboard",
    (valor) => {
      expect(safeRedirectPath(valor)).toBe("/dashboard");
    },
  );

  it("recusa parâmetro repetido (lista)", () => {
    expect(safeRedirectPath(["/assinaturas", "/alertas"])).toBe("/dashboard");
  });
});
