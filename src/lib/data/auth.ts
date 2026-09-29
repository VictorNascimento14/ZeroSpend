import { defaultAlertSettings } from "@/lib/domain/alerts";
import { DEFAULT_BRL_PER_USD } from "@/lib/domain/billing";
import type { Organization, User } from "@/lib/domain/types";
import { validateAccountDraft, type AccountDraft } from "@/lib/domain/validation";
import { hashPassword, newSalt } from "./password";
import { EMAIL_TAKEN, newId, ValidationError, type Repository, type Session } from "./repository";

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

/**
 * Cria a conta (pessoa, empresa em real, vínculo de administração) e já entra nela. Valida tudo antes
 * de gravar; o e-mail repetido aparece no campo do e-mail. A senha vira hash com sal novo.
 */
export async function createAccount(repository: Repository, draft: AccountDraft, now = new Date()): Promise<Session> {
  const normalized: AccountDraft = {
    name: draft.name.trim(),
    email: normalizeEmail(draft.email),
    password: draft.password,
    organizationName: draft.organizationName.trim(),
  };
  const errors = validateAccountDraft(normalized);
  if (!errors.email && repository.getDatabase().users.some((user) => user.email === normalized.email)) {
    errors.email = EMAIL_TAKEN;
  }
  if (Object.keys(errors).length > 0) throw new ValidationError<AccountDraft>(errors);

  const passwordSalt = newSalt();
  const user: User = {
    id: newId(),
    name: normalized.name,
    email: normalized.email,
    passwordHash: await hashPassword(normalized.password, passwordSalt),
    passwordSalt,
  };
  const organization: Organization = {
    id: newId(),
    name: normalized.organizationName,
    createdAt: now.toISOString(),
    defaultCurrency: "BRL",
    brlPerUsd: DEFAULT_BRL_PER_USD,
    ...defaultAlertSettings(),
  };
  return repository.addAccount(user, organization);
}
