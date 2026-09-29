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

/**
 * Soma meses a uma data sem hora. O dia que não existe no mês de destino encosta no último:
 * 31/01 + 1 mês = 28/02 (29 em ano bissexto).
 */
export function addMonths(date: IsoDate, months: number): IsoDate {
  const [year, month, day] = date.split("-").map(Number);
  const total = year * 12 + (month - 1) + months;
  const targetMonth = ((total % 12) + 12) % 12;
  const targetYear = (total - targetMonth) / 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return fromUtc(new Date(Date.UTC(targetYear, targetMonth, Math.min(day, lastDay))));
}

/** Soma dias a uma data sem hora (negativo volta). A conta é em UTC: sem horário de verão no caminho. */
export function addDays(date: IsoDate, days: number): IsoDate {
  const [year, month, day] = date.split("-").map(Number);
  return fromUtc(new Date(Date.UTC(year, month - 1, day + days)));
}

function fromUtc(utc: Date): IsoDate {
  const month = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const day = String(utc.getUTCDate()).padStart(2, "0");
  return `${utc.getUTCFullYear()}-${month}-${day}`;
}
