import { describe, expect, it } from "vitest";
import { isCategory } from "@/lib/domain/categories";
import { toWords } from "@/lib/domain/text";
import { KNOWN_VENDORS, knownVendorByName, recognizeVendor } from "./vendors";

describe("recognizeVendor", () => {
  it.each([
    ["ZOOM.US 888-799-9666", "Zoom"],
    ["GOOGLE *GSUITE exemplo.com", "Google Workspace"],
    ["PAG*CONTAAZUL", "Conta Azul"],
    ["OPENAI *CHATGPT SUBSCR", "ChatGPT Team"],
    ["Slack T01ABCD", "Slack"],
    ["FIGMA MONTHLY", "Figma"],
  ])("reconhece %s como %s", (descricao, nome) => {
    expect(recognizeVendor(descricao)?.name).toBe(nome);
  });

  it("casa só palavra inteira e não reconhece o que não é SaaS", () => {
    expect(recognizeVendor("ZOOMCAR LOCADORA")).toBeNull();
    expect(recognizeVendor("PADARIA DO BAIRRO")).toBeNull();
    expect(recognizeVendor("GOOGLE PLAY")).toBeNull();
  });
});

describe("catálogo", () => {
  it("tem nomes únicos, categorias válidas e padrões já em palavras", () => {
    const nomes = KNOWN_VENDORS.map((v) => v.name);
    expect(new Set(nomes).size).toBe(nomes.length);
    for (const vendor of KNOWN_VENDORS) {
      expect(isCategory(vendor.category)).toBe(true);
      for (const padrao of vendor.patterns) expect(padrao).toBe(toWords(padrao));
    }
  });

  it("acha o fornecedor pelo nome exato, sem diferenciar maiúscula", () => {
    expect(knownVendorByName("google workspace")?.tone).toBe("raspberry");
    expect(knownVendorByName("Ferramenta Nova")).toBeNull();
  });
});
