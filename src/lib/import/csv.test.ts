import { describe, expect, it } from "vitest";
import { decodeStatement, parseAmount, parseDate, parseStatement } from "./csv";

describe("parseStatement", () => {
  it("lê o formato brasileiro: ponto e vírgula, vírgula decimal, BOM, \\r\\n e aspas", () => {
    const csv = '﻿Data;Descrição;Valor\r\n05/09/2026;"ZOOM.US 888-799-9666";"159,90"\r\n12/09/2026;GOOGLE *GSUITE;R$ 1.176,00\r\n';
    const lido = parseStatement(csv);
    expect(lido).toEqual({
      ok: true,
      lines: [
        { line: 2, date: "2026-09-05", description: "ZOOM.US 888-799-9666", amount: 159.9 },
        { line: 3, date: "2026-09-12", description: "GOOGLE *GSUITE", amount: 1176 },
      ],
      problems: [],
    });
  });

  it("lê vírgula como separador, data ISO e ponto decimal, com vírgula dentro de aspas", () => {
    const lido = parseStatement('date,description,amount\n2026-09-05,"Slack, plano Pro",880.00\n');
    expect(lido.ok && lido.lines).toEqual([{ line: 2, date: "2026-09-05", description: "Slack, plano Pro", amount: 880 }]);
  });

  it("acha as colunas pelos sinônimos, sem acento", () => {
    const lido = parseStatement("Data da compra;Histórico;Valor (R$)\n05/09/26;Notion Labs;50,00\n");
    expect(lido.ok && lido.lines[0]).toMatchObject({ date: "2026-09-05", description: "Notion Labs", amount: 50 });
  });

  it("diz qual linha não deu para ler, pula a vazia e segue", () => {
    const lido = parseStatement("Data;Descrição;Valor\n31/02/2026;Slack;10,00\n\n05/09/2026;Slack;dez reais\n05/09/2026;;10,00\n05/09/2026;Slack;10,00\n");
    expect(lido.ok && lido.problems).toEqual([
      { line: 2, reason: "Data que não dá para ler." },
      { line: 4, reason: "Valor que não dá para ler." },
      { line: 5, reason: "Descrição vazia." },
    ]);
    expect(lido.ok && lido.lines.map((l) => l.line)).toEqual([6]);
  });

  it("recusa arquivo sem as colunas mínimas, e arquivo vazio", () => {
    expect(parseStatement("Quando;Onde\n05/09/2026;Slack\n")).toEqual({
      ok: false,
      error: "Não achei as colunas Data, Descrição e Valor no cabeçalho do arquivo.",
    });
    expect(parseStatement("")).toMatchObject({ ok: false });
  });
});

describe("parseAmount e parseDate", () => {
  it.each([
    ["1.234,56", 1234.56],
    ["159,90", 159.9],
    ["R$ 85,00", 85],
    ["-85,00", -85],
    ["(85,00)", -85],
    ["1234.56", 1234.56],
    ["1,234.56", 1234.56],
    ["1.234", 1234],
  ])("valor %s → %d", (bruto, esperado) => {
    expect(parseAmount(bruto)).toBe(esperado);
  });

  it("recusa valor sem número", () => {
    expect(parseAmount("dez")).toBeNull();
    expect(parseAmount("")).toBeNull();
  });

  it("lê data brasileira, com ano curto, e ISO; recusa a que não existe", () => {
    expect(parseDate("05/09/2026")).toBe("2026-09-05");
    expect(parseDate("05/09/26")).toBe("2026-09-05");
    expect(parseDate("2026-09-05T10:00:00")).toBe("2026-09-05");
    expect(parseDate("31/02/2026")).toBeNull();
    expect(parseDate("09-05-2026")).toBeNull();
  });
});

describe("decodeStatement", () => {
  it("lê UTF-8 e cai para Windows-1252, o formato comum dos bancos", () => {
    const utf8 = new TextEncoder().encode("Data;Descrição;Valor\n");
    const windows1252 = Uint8Array.from([..."Data;Descri"].map((c) => c.charCodeAt(0)).concat([0xe7, 0xe3], [..."o;Valor\n"].map((c) => c.charCodeAt(0))));
    expect(decodeStatement(utf8)).toBe("Data;Descrição;Valor\n");
    expect(decodeStatement(windows1252)).toBe("Data;Descrição;Valor\n");
    expect(parseStatement(decodeStatement(windows1252)).ok).toBe(true);
  });
});
