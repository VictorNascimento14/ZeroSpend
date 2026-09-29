/** Texto para comparar: sem acento e em minúsculas — "Clínica" e "clinica" são iguais. */
export function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/**
 * Texto em palavras: sem acento, minúsculo, e tudo que não é letra ou número vira espaço —
 * "ZOOM.US 888-799" vira "zoom us 888 799", e "GOOGLE *GSUITE" vira "google gsuite".
 */
export function toWords(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]+/g, " ").trim();
}
