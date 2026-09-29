import { describe, expect, it } from "vitest";
import { knownVendorByName } from "./vendors";
import { demoInvoices } from "./email";

describe("demoInvoices", () => {
  it("guarda só os metadados da fatura, nada da mensagem", () => {
    for (const fatura of demoInvoices("2026-09-29")) {
      expect(Object.keys(fatura).sort()).toEqual(["amount", "category", "currency", "date", "vendorName"]);
    }
  });

  it("traz faturas passadas de fornecedores do catálogo, na categoria dele", () => {
    for (const fatura of demoInvoices("2026-09-29")) {
      expect(fatura.date < "2026-09-29").toBe(true);
      expect(fatura.amount).toBeGreaterThan(0);
      expect(knownVendorByName(fatura.vendorName)?.category).toBe(fatura.category);
    }
  });
});
