/**
 * Senha da v1: guardada no navegador como PBKDF2-SHA-256 com sal, nunca em texto. Não é segurança —
 * quem usa a máquina lê o `localStorage` (ADR-001) —, mas quem digitar a senha de verdade não a deixa
 * legível. Com backend, a senha sai do cliente por completo.
 */
const ITERATIONS = 100_000;

export function newSalt(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)));
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  // A Web Crypto só existe em contexto seguro: https ou localhost (não pelo IP da rede local).
  if (!globalThis.crypto?.subtle) {
    throw new Error("Abra o ZeroSpend por https ou localhost: fora disso o navegador não protege a senha.");
  }
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromHex(salt), iterations: ITERATIONS },
    key,
    256,
  );
  return toHex(new Uint8Array(bits));
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(hex.match(/../g) ?? [], (pair) => Number.parseInt(pair, 16));
}
