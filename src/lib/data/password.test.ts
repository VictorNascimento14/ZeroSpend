import { describe, expect, it } from "vitest";
import { hashPassword, newSalt } from "./password";

describe("senha", () => {
  it("dá o mesmo hash para a mesma senha e o mesmo sal, e outro com sal ou senha diferentes", async () => {
    const sal = newSalt();
    const hash = await hashPassword("segredo-de-teste", sal);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashPassword("segredo-de-teste", sal)).toBe(hash);
    expect(await hashPassword("segredo-de-teste", newSalt())).not.toBe(hash);
    expect(await hashPassword("outro-segredo", sal)).not.toBe(hash);
  });

  it("gera sal novo a cada chamada", () => {
    expect(newSalt()).toMatch(/^[0-9a-f]{32}$/);
    expect(newSalt()).not.toBe(newSalt());
  });
});
