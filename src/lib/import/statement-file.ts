import { decodeStatement, parseStatement, type StatementProblem } from "./csv";
import { readStatement, type StatementReading } from "./recognize";

/** Um extrato de 500 linhas tem uns 40 KB: 2 MB é folga, e barra o arquivo trocado por engano. */
export const STATEMENT_MAX_BYTES = 2 * 1024 * 1024;

export type StatementFileResult =
  | { kind: "read"; reading: StatementReading; problems: StatementProblem[]; lineCount: number }
  | { kind: "pdf" }
  | { kind: "error"; message: string };

/**
 * O arquivo que a pessoa escolheu ou soltou na tela. O CSV é lido aqui mesmo, no navegador, e nada
 * dele é guardado; o PDF depende do servidor, que a v1 não tem.
 */
export async function readStatementFile(file: File): Promise<StatementFileResult> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return { kind: "pdf" };
  if (!name.endsWith(".csv") && file.type !== "text/csv") {
    return { kind: "error", message: "Esse tipo de arquivo não é lido. Envie o extrato em CSV." };
  }
  if (file.size > STATEMENT_MAX_BYTES) {
    return { kind: "error", message: "O arquivo passa de 2 MB, bem mais que um extrato de cartão. Confira se é o arquivo certo." };
  }
  const parsed = parseStatement(decodeStatement(await file.arrayBuffer()));
  if (!parsed.ok) return { kind: "error", message: parsed.error };
  if (parsed.lines.length === 0 && parsed.problems.length === 0) {
    return { kind: "error", message: "O arquivo só tem o cabeçalho, sem nenhum lançamento." };
  }
  return { kind: "read", reading: readStatement(parsed.lines), problems: parsed.problems, lineCount: parsed.lines.length };
}
