import { DEFAULT_BRL_PER_USD } from "@/lib/domain/billing";
import type { IsoDate, Membership, Organization, Role, Subscription, User } from "@/lib/domain/types";
import { validateSubscriptionDraft, type FieldErrors, type SubscriptionDraft } from "@/lib/domain/validation";
import { createDemoData } from "./seed";

/**
 * Chave versionada: formato novo ganha chave nova, e a antiga fica intacta. A v1 (sem usuários) nunca
 * saiu de uma máquina de desenvolvimento, então a v2 começa da demonstração, sem migração.
 */
export const STORAGE_KEY = "zerospend:v2";

/** Onde fica o conteúdo que não deu para ler — guardado, em vez de apagado. */
export const BACKUP_KEY = `${STORAGE_KEY}:backup`;

export interface Database {
  version: 2;
  organizations: Organization[];
  subscriptions: Subscription[];
  users: User[];
  memberships: Membership[];
  /** Quem está usando este navegador e em qual empresa. `null` é ninguém. */
  session: Session | null;
}

export interface Session {
  userId: string;
  organizationId: string;
}

/** A sessão resolvida para a tela: a pessoa, a empresa atual, o papel ali e as empresas dela. */
export interface CurrentSession {
  user: User;
  organization: Organization;
  role: Role;
  /** Todas as empresas em que a pessoa tem vínculo, em ordem alfabética (o seletor do header). */
  organizations: Organization[];
}

/** Resolve a sessão gravada. `null` se não há sessão ou se ela aponta para algo que não existe mais. */
export function currentSession(database: Database): CurrentSession | null {
  const { session } = database;
  if (!session) return null;
  const user = database.users.find((candidate) => candidate.id === session.userId);
  const organization = database.organizations.find((candidate) => candidate.id === session.organizationId);
  const membership = database.memberships.find(
    (candidate) => candidate.userId === session.userId && candidate.organizationId === session.organizationId,
  );
  if (!user || !organization || !membership) return null;
  const organizations = database.memberships
    .filter((candidate) => candidate.userId === user.id)
    .flatMap((candidate) => database.organizations.filter((org) => org.id === candidate.organizationId))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return { user, organization, role: membership.role, organizations };
}

/** O pedaço do `localStorage` que o repositório usa. Nos testes, um `Map` faz o papel. */
export type KeyValueStorage = Pick<Storage, "getItem" | "setItem">;

/** Erro de formulário: uma mensagem por campo, pronta para a tela. */
export class ValidationError<T = SubscriptionDraft> extends Error {
  constructor(readonly fields: FieldErrors<T>) {
    super("Há campos inválidos.");
    this.name = "ValidationError";
  }
}

export type Repository = ReturnType<typeof createRepository>;

/**
 * O repositório local (ADR-001): única porta de leitura e escrita dos dados. Na primeira leitura de
 * um navegador vazio, semeia a demonstração. Toda escrita valida antes de gravar; se o armazenamento
 * recusar (cota cheia), a exceção sobe e nada muda.
 */
export function createRepository(storage: KeyValueStorage, today: () => IsoDate) {
  let cache: Database | null = null;
  const listeners = new Set<() => void>();

  function load(): Database {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = parse(raw);
      if (parsed) return parsed;
      storage.setItem(BACKUP_KEY, raw);
    }
    const demo: Database = { version: 2, ...createDemoData(today()), session: null };
    storage.setItem(STORAGE_KEY, JSON.stringify(demo));
    return demo;
  }

  function getDatabase(): Database {
    cache ??= load();
    return cache;
  }

  function commit(next: Database): void {
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
    cache = next;
    for (const listener of listeners) listener();
  }

  function findSubscription(id: string): Subscription {
    const found = getDatabase().subscriptions.find((subscription) => subscription.id === id);
    if (!found) throw new Error("Assinatura não encontrada.");
    return found;
  }

  return {
    getDatabase,

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    /** Outra aba mudou o armazenamento: relê na próxima leitura. */
    invalidate(): void {
      cache = null;
      for (const listener of listeners) listener();
    },

    addSubscription(organizationId: string, draft: SubscriptionDraft): Subscription {
      const database = getDatabase();
      if (!database.organizations.some((organization) => organization.id === organizationId)) {
        throw new Error("Empresa não encontrada.");
      }
      const created = stored(newId(), organizationId, checked(draft));
      commit({ ...database, subscriptions: [...database.subscriptions, created] });
      return created;
    },

    updateSubscription(id: string, changes: Partial<SubscriptionDraft>): Subscription {
      const current = findSubscription(id);
      const updated = stored(id, current.organizationId, checked({ ...current, ...changes }));
      const database = getDatabase();
      commit({ ...database, subscriptions: database.subscriptions.map((s) => (s.id === id ? updated : s)) });
      return updated;
    },

    /**
     * Conta nova: pessoa, empresa, vínculo de administração e a sessão aberta na empresa — tudo numa
     * gravação. Quem valida e faz o hash da senha é `createAccount` (auth.ts); aqui, a unicidade do
     * e-mail é conferida de novo, perto da gravação.
     */
    addAccount(user: User, organization: Organization): Session {
      const database = getDatabase();
      if (database.users.some((candidate) => candidate.email === user.email)) {
        throw new ValidationError<{ email: string }>({ email: EMAIL_TAKEN });
      }
      const session = { userId: user.id, organizationId: organization.id };
      commit({
        ...database,
        users: [...database.users, user],
        organizations: [...database.organizations, organization],
        memberships: [...database.memberships, { userId: user.id, organizationId: organization.id, role: "admin" }],
        session,
      });
      return session;
    },

    /** Abre a sessão na primeira empresa da pessoa. Quem confere a senha é `signIn` (auth.ts). */
    startSession(userId: string): Session {
      const database = getDatabase();
      const membership = database.memberships.find((candidate) => candidate.userId === userId);
      if (!membership) throw new Error("Esta conta não tem empresa.");
      const session = { userId, organizationId: membership.organizationId };
      commit({ ...database, session });
      return session;
    },

    endSession(): void {
      commit({ ...getDatabase(), session: null });
    },

    /** Troca a empresa da sessão — só para uma em que a pessoa tem vínculo. */
    selectOrganization(organizationId: string): void {
      const database = getDatabase();
      const { session } = database;
      if (!session) throw new Error("Ninguém entrou.");
      const allowed = database.memberships.some(
        (candidate) => candidate.userId === session.userId && candidate.organizationId === organizationId,
      );
      if (!allowed) throw new Error("Você não tem acesso a esta empresa.");
      commit({ ...database, session: { ...session, organizationId } });
    },

    /**
     * Empresa nova para quem está na sessão: em real, com a cotação inicial, vínculo de administração —
     * e a sessão passa para ela.
     */
    addOrganization(name: string, now = new Date()): Organization {
      const database = getDatabase();
      const { session } = database;
      if (!session) throw new Error("Ninguém entrou.");
      if (!name.trim()) throw new ValidationError<{ name: string }>({ name: "Informe o nome da empresa." });
      const organization: Organization = {
        id: newId(),
        name: name.trim(),
        createdAt: now.toISOString(),
        defaultCurrency: "BRL",
        brlPerUsd: DEFAULT_BRL_PER_USD,
      };
      commit({
        ...database,
        organizations: [...database.organizations, organization],
        memberships: [...database.memberships, { userId: session.userId, organizationId: organization.id, role: "admin" }],
        session: { ...session, organizationId: organization.id },
      });
      return organization;
    },

    /**
     * O "desfazer" da exclusão: devolve a assinatura com o mesmo id. Valida de novo e recusa se a
     * empresa sumiu ou se o id já voltou (dois cliques em "Desfazer").
     */
    restoreSubscription(subscription: Subscription): Subscription {
      const database = getDatabase();
      if (!database.organizations.some((organization) => organization.id === subscription.organizationId)) {
        throw new Error("Empresa não encontrada.");
      }
      if (database.subscriptions.some((candidate) => candidate.id === subscription.id)) {
        throw new Error("Esta assinatura já está na lista.");
      }
      const restored = stored(subscription.id, subscription.organizationId, checked(subscription));
      commit({ ...database, subscriptions: [...database.subscriptions, restored] });
      return restored;
    },

    /** Devolve a assinatura removida, para quem quiser oferecer "desfazer". */
    removeSubscription(id: string): Subscription {
      const removed = findSubscription(id);
      const database = getDatabase();
      commit({ ...database, subscriptions: database.subscriptions.filter((s) => s.id !== id) });
      return removed;
    },
  };
}

export const EMAIL_TAKEN = "Já existe uma conta com este e-mail.";

/** `randomUUID` só existe em contexto seguro (https ou localhost) — pelo IP da rede local, não. */
export function newId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
}

function checked(draft: SubscriptionDraft): SubscriptionDraft {
  const errors = validateSubscriptionDraft(draft);
  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
  return draft;
}

/** Monta o registro campo a campo: o que não é do modelo não vai para o armazenamento. */
function stored(id: string, organizationId: string, draft: SubscriptionDraft): Subscription {
  return {
    id,
    organizationId,
    vendorName: draft.vendorName.trim(),
    category: draft.category,
    amount: draft.amount,
    currency: draft.currency,
    billingCycle: draft.billingCycle,
    nextBillingDate: draft.nextBillingDate,
    status: draft.status,
    source: draft.source,
    ...(draft.owner?.trim() ? { owner: draft.owner.trim() } : {}),
  };
}

function parse(raw: string): Database | null {
  try {
    const value = JSON.parse(raw) as Partial<Database> | null;
    const valid =
      value?.version === 2 &&
      Array.isArray(value.organizations) &&
      Array.isArray(value.subscriptions) &&
      Array.isArray(value.users) &&
      Array.isArray(value.memberships);
    return valid ? (value as Database) : null;
  } catch {
    return null;
  }
}
