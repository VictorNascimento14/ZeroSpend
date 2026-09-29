import { describe, expect, it } from "vitest";
import { CATEGORIES, CATEGORY_IDS, isCategory } from "./categories";

describe("categorias", () => {
  it("reconhece só as da lista fechada", () => {
    expect(isCategory("crm")).toBe(true);
    expect(isCategory("CRM")).toBe(false);
    expect(isCategory("vendas")).toBe(false);
    expect(isCategory("toString")).toBe(false);
  });

  it("tem rótulo para toda categoria", () => {
    expect(CATEGORY_IDS.length).toBeGreaterThan(0);
    for (const id of CATEGORY_IDS) expect(CATEGORIES[id]).not.toBe("");
  });
});
