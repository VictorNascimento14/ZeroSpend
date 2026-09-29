import { describe, expect, it } from "vitest";
import type { Subscription } from "@/lib/domain/types";
import { validateSubscriptionDraft } from "@/lib/domain/validation";
import { parseStatement, type StatementLine } from "./csv";
import { isAlreadyTracked, readStatement, toDraft } from "./recognize";

function linha(line: number, date: string, description: string, amount: number): StatementLine {
  return { line, date, description, amount };
}

describe("readStatement", () => {
  it("agrupa por fornecedor com a cobrança mais recente, separa o não reconhecido e ignora créditos", () => {
    const leitura = readStatement([
      linha(2, "2026-08-05", "ZOOM.US", 149.9),
      linha(3, "2026-09-05", "ZOOM.US", 159.9),
      linha(4, "2026-09-10", "PADARIA DO BAIRRO", 23.5),
      linha(5, "2026-09-12", "GOOGLE *GSUITE", 1176),
      linha(6, "2026-09-15", "PAGAMENTO RECEBIDO", -3000),
    ]);
    expect(leitura.detected.map((d) => [d.vendor.name, d.amount, d.lastChargeDate, d.charges])).toEqual([
      ["Google Workspace", 1176, "2026-09-12", 1],
      ["Zoom", 159.9, "2026-09-05", 2],
    ]);
    expect(leitura.unrecognized.map((l) => l.description)).toEqual(["PADARIA DO BAIRRO"]);
    expect(leitura.ignoredCredits).toBe(1);
  });

  it("entende o banco que escreve compra como valor negativo", () => {
    const leitura = readStatement([
      linha(2, "2026-09-05", "SLACK", -880),
      linha(3, "2026-09-06", "FIGMA", -405),
      linha(4, "2026-09-20", "ESTORNO", 50),
    ]);
    expect(leitura.detected.map((d) => [d.vendor.name, d.amount])).toEqual([
      ["Figma", 405],
      ["Slack", 880],
    ]);
    expect(leitura.ignoredCredits).toBe(1);
  });
});

describe("toDraft e isAlreadyTracked", () => {
  const [zoom] = readStatement([linha(2, "2026-09-05", "ZOOM.US", 159.9)]).detected;

  it("vira assinatura em revisão, mensal, em real, com a próxima cobrança um mês depois", () => {
    const rascunho = toDraft(zoom);
    expect(rascunho).toEqual({
      vendorName: "Zoom",
      category: "meetings",
      amount: 159.9,
      currency: "BRL",
      billingCycle: "monthly",
      nextBillingDate: "2026-10-05",
      status: "review_needed",
      source: "csv_upload",
    });
    expect(validateSubscriptionDraft(rascunho)).toEqual({});
  });

  it("reconhece o que a empresa já acompanha, mas não o que foi cancelado", () => {
    const existente = { vendorName: "zoom", status: "active" } as Subscription;
    expect(isAlreadyTracked(zoom, [existente])).toBe(true);
    expect(isAlreadyTracked(zoom, [{ ...existente, status: "cancelled" }])).toBe(false);
  });
});

describe("desempenho (especificação: 500 linhas em menos de 10 s)", () => {
  it("lê e reconhece 500 linhas bem abaixo disso", () => {
    const corpo = Array.from({ length: 500 }, (_, i) => `05/09/2026;${i % 2 ? "ZOOM.US" : "LOJA " + i};${i},90`).join("\n");
    const inicio = performance.now();
    const lido = parseStatement(`Data;Descrição;Valor\n${corpo}\n`);
    const leitura = readStatement(lido.ok ? lido.lines : []);
    const ms = performance.now() - inicio;
    expect(lido.ok && lido.lines).toHaveLength(500);
    expect(leitura.detected).toHaveLength(1);
    expect(ms).toBeLessThan(1000);
  });
});
