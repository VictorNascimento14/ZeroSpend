import { describe, expect, it } from "vitest";
import { readStatementFile, STATEMENT_MAX_BYTES } from "./statement-file";

// Windows-1252, como o banco exporta: "ç" é 0xE7 e "ã" é 0xE3.
function windows1252(text: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(text, (char) => char.charCodeAt(0));
}

describe("readStatementFile", () => {
  it("lê o CSV em Windows-1252 e reconhece os fornecedores", async () => {
    const texto = "Data;Descrição;Valor\n05/09/2026;SLACK T0123 DUBLIN;262,50\n06/09/2026;PADARIA EXEMPLO;18,00\n07/09/2026;?;abc\n";
    const resultado = await readStatementFile(new File([windows1252(texto)], "fatura.csv"));
    expect(resultado.kind).toBe("read");
    if (resultado.kind !== "read") return;
    expect(resultado.reading.detected.map((d) => d.vendor.name)).toEqual(["Slack"]);
    expect(resultado.reading.unrecognized.map((l) => l.description)).toEqual(["PADARIA EXEMPLO"]);
    expect(resultado.problems).toHaveLength(1);
    expect(resultado.lineCount).toBe(2);
  });

  it("separa o PDF, que depende do servidor, e recusa o que não é extrato", async () => {
    expect((await readStatementFile(new File(["%PDF"], "fatura.PDF"))).kind).toBe("pdf");
    expect(await readStatementFile(new File(["x"], "fatura.xlsx"))).toMatchObject({ kind: "error" });
    expect(await readStatementFile(new File([new Uint8Array(STATEMENT_MAX_BYTES + 1)], "grande.csv"))).toMatchObject({
      kind: "error",
      message: expect.stringContaining("2 MB"),
    });
  });

  it("explica o CSV sem colunas ou sem lançamentos", async () => {
    expect(await readStatementFile(new File(["Nome;Idade\nA;1\n"], "x.csv"))).toMatchObject({
      message: "Não achei as colunas Data, Descrição e Valor no cabeçalho do arquivo.",
    });
    expect(await readStatementFile(new File(["Data;Descrição;Valor\n"], "x.csv"))).toMatchObject({
      message: "O arquivo só tem o cabeçalho, sem nenhum lançamento.",
    });
  });
});
