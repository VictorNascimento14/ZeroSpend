import type { IsoDate } from "./types";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `YYYY-MM-DD` que existe no calendário — recusa `2026-02-30` e `2026-10-5`. */
export function isIsoDate(value: string): value is IsoDate {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const utc = new Date(Date.UTC(year, month - 1, day));
  return utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day;
}

/**
 * O dia local de um instante, como data sem hora. É assim que a tela calcula o "hoje" que entrega às
 * regras — elas nunca chamam `new Date()` por conta própria.
 */
export function toIsoDate(instant: Date): IsoDate {
  const month = String(instant.getMonth() + 1).padStart(2, "0");
  const day = String(instant.getDate()).padStart(2, "0");
  return `${instant.getFullYear()}-${month}-${day}`;
}
