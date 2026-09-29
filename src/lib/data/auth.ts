import { hashPassword } from "./password";
import type { Repository, Session } from "./repository";

export class SignInError extends Error {
  constructor() {
    super("E-mail ou senha incorretos.");
    this.name = "SignInError";
  }
}

/** E-mail como chave de entrada: sem espaços nas pontas e em minúsculas. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Entra com e-mail e senha, conferindo o hash guardado. A mesma mensagem para e-mail desconhecido e
 * senha errada: a tela não revela quais e-mails têm conta.
 */
export async function signIn(repository: Repository, email: string, password: string): Promise<Session> {
  const user = repository.getDatabase().users.find((candidate) => candidate.email === normalizeEmail(email));
  if (!user || (await hashPassword(password, user.passwordSalt)) !== user.passwordHash) {
    throw new SignInError();
  }
  return repository.startSession(user.id);
}
