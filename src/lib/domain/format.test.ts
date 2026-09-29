import { describe, expect, it } from "vitest";
import { formatDate, formatMoney } from "./format";

// O Intl separa o símbolo do número com espaço não separável (U+00A0), não com espaço comum.
const nbsp = " ";

describe("formatMoney", () => {
  it("formata real no padrão brasileiro", () => {
    expect(formatMoney(8450, "BRL")).toBe(`R$${nbsp}8.450,00`);
    expect(formatMoney(99.9, "BRL")).toBe(`R$${nbsp}99,90`);
  });

  it("formata dólar com o símbolo US$", () => {
    expect(formatMoney(12, "USD")).toBe(`US$${nbsp}12,00`);
  });

  it("arredonda para centavos", () => {
    expect(formatMoney(1200 / 12 / 7, "BRL")).toBe(`R$${nbsp}14,29`);
  });
});

describe("formatDate", () => {
  it("mostra dia/mês/ano sem passar por Date", () => {
    expect(formatDate("2026-10-05")).toBe("05/10/2026");
    expect(formatDate("2027-01-31")).toBe("31/01/2027");
  });
});
