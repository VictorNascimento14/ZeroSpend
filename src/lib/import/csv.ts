import { isIsoDate } from "@/lib/domain/dates";
import { toWords } from "@/lib/domain/text";
import type { IsoDate } from "@/lib/domain/types";

/** Uma linha do extrato que deu para ler. `line` é a posição no arquivo (o cabeçalho é a 1). */
export interface StatementLine {
  line: number;
  date: IsoDate;
  description: string;
  amount: number;
}

export interface StatementProblem {
  line: number;
  reason: string;
}

export type ParsedStatement =
  | { ok: true; lines: StatementLine[]; problems: StatementProblem[] }
  | { ok: false; error: string };

// Começo do nome da coluna, sem acento — "Descrição", "Histórico", "Valor (R$)"… (campos mínimos da
// especificação: Data, Descrição, Valor).
const COLUMNS = {
  date: ["data", "date"],
  description: ["descricao", "description", "historico", "estabelecimento", "lancamento"],
  amount: ["valor", "amount"],
} as const;

/**
 * Lê o extrato do cartão (CSV) no navegador. Aceita `;` ou `,` como separador (o do cabeçalho),
 * aspas, BOM e `\r\n`. Linha que não dá para ler vira um problema com o motivo — não derruba o resto.
 */
export function parseStatement(text: string): ParsedStatement {
  const content = text.replace(/^﻿/, "");
  const firstLine = content.slice(0, content.search(/\r?\n|$/));
  const delimiter = [";", ",", "\t"].reduce((best, candidate) =>
    count(firstLine, candidate) > count(firstLine, best) ? candidate : best,
  );
  const [header, ...records] = splitRecords(content, delimiter);
  if (!header) return { ok: false, error: "O arquivo está vazio." };

  const column = (names: readonly string[]) =>
    header.findIndex((cell) => names.some((name) => toWords(cell).startsWith(name)));
  const index = { date: column(COLUMNS.date), description: column(COLUMNS.description), amount: column(COLUMNS.amount) };
  if (Object.values(index).some((position) => position < 0)) {
    return { ok: false, error: "Não achei as colunas Data, Descrição e Valor no cabeçalho do arquivo." };
  }

  const lines: StatementLine[] = [];
  const problems: StatementProblem[] = [];
  records.forEach((cells, position) => {
    const line = position + 2;
    if (cells.every((cell) => cell.trim() === "")) return;
    const date = parseDate(cells[index.date] ?? "");
    const amount = parseAmount(cells[index.amount] ?? "");
    const description = (cells[index.description] ?? "").trim();
    if (!date) problems.push({ line, reason: "Data que não dá para ler." });
    else if (amount === null) problems.push({ line, reason: "Valor que não dá para ler." });
    else if (!description) problems.push({ line, reason: "Descrição vazia." });
    else lines.push({ line, date, description, amount });
  });
  return { ok: true, lines, problems };
}

/** `05/09/2026`, `05/09/26` ou `2026-09-05` → `2026-09-05`. Sem `Date`: nada de fuso no caminho. */
export function parseDate(raw: string): IsoDate | null {
  const value = raw.trim();
  const br = /^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/.exec(value);
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const candidate = br ? `${br[3].length === 2 ? `20${br[3]}` : br[3]}-${br[2]}-${br[1]}` : iso ? iso[0] : "";
  return isIsoDate(candidate) ? candidate : null;
}

/**
 * Valor como o banco escreve: "R$ 1.234,56", "159,90", "-85,00", "(85,00)" ou "1234.56". O separador
 * decimal é o último ponto ou vírgula; "1.234" sem centavos é milhar, como no Brasil.
 */
export function parseAmount(raw: string): number | null {
  let value = raw.replace(/\s|R\$|US\$|BRL/gi, "");
  const negative = /^-|-$|^\(.*\)$/.test(value);
  value = value.replace(/[()+-]/g, "");
  if (!/^[\d.,]+$/.test(value)) return null;
  const lastComma = value.lastIndexOf(",");
  const lastDot = value.lastIndexOf(".");
  if (lastComma > lastDot) value = value.replace(/\./g, "").replace(",", ".");
  else if (lastComma !== -1) value = value.replace(/,/g, "");
  else if (!/\.\d{1,2}$/.test(value)) value = value.replace(/\./g, "");
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return negative ? -amount : amount;
}

function count(text: string, char: string): number {
  return text.split(char).length - 1;
}

/** Quebra o texto em registros e campos, respeitando aspas (com `""` como aspa escapada). */
function splitRecords(text: string, delimiter: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === delimiter) {
      record.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else field += char;
  }
  if (field !== "" || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  return records;
}
