import { defaultAlertSettings, type AlertSettings } from "@/lib/domain/alerts";
import { DEFAULT_BRL_PER_USD } from "@/lib/domain/billing";
import { normalizeEmail } from "@/lib/domain/text";
import type {
  AlertDismissal,
  Invitation,
  IsoDate,
  Membership,
  Organization,
  Role,
  Subscription,
  User,
} from "@/lib/domain/types";
import {
  validateAlertSettings,
  validateInviteDraft,
  validateOrganizationDraft,
  validateSubscriptionDraft,
  type FieldErrors,
  type InviteDraft,
  type OrganizationDraft,
  type SubscriptionDraft,
} from "@/lib/domain/validation";
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
  /** Os alertas que cada empresa dispensou. Campo novo com padrão na leitura: falta = nenhum. */
  dismissals: AlertDismissal[];
  /** Os convites pendentes. Campo novo com padrão na leitura: falta = nenhum. */
  invitations: Invitation[];
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
    const demo: Database = { version: 2, ...createDemoData(today()), dismissals: [], invitations: [], session: null };
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

  /** Valida todas antes e grava numa operação só: ou entram todas, ou nenhuma. */
  function addSubscriptions(organizationId: string, drafts: SubscriptionDraft[]): Subscription[] {
    const database = getDatabase();
    if (!database.organizations.some((organization) => organization.id === organizationId)) {
      throw new Error("Empresa não encontrada.");
    }
    const created = drafts.map((draft) => stored(newId(), organizationId, checked(draft)));
    commit({ ...database, subscriptions: [...database.subscriptions, ...created] });
    return created;
  }

  /** A empresa, se quem está na sessão a administra. É a regra de papel das configurações. */
  function administeredOrganization(organizationId: string): Organization {
    const database = getDatabase();
    const current = database.organizations.find((organization) => organization.id === organizationId);
    if (!current) throw new Error("Empresa não encontrada.");
    const { session } = database;
    const admin = database.memberships.some(
      (m) => m.userId === session?.userId && m.organizationId === organizationId && m.role === "admin",
    );
    if (!admin) throw new Error("Só quem administra a empresa altera estes dados.");
    return current;
  }

  function replaceOrganization(updated: Organization): Organization {
    const database = getDatabase();
    commit({
      ...database,
      organizations: database.organizations.map((organization) => (organization.id === updated.id ? updated : organization)),
    });
    return updated;
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
      return addSubscriptions(organizationId, [draft])[0];
    },

    /** Várias de uma vez: a importação do extrato. */
    addSubscriptions,

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
      // Os convites pendentes para este e-mail viram vínculo: a pessoa entra também nessas empresas.
      const invited = database.invitations.filter((invitation) => invitation.email === user.email);
      commit({
        ...database,
        users: [...database.users, user],
        organizations: [...database.organizations, organization],
        memberships: [
          ...database.memberships,
          { userId: user.id, organizationId: organization.id, role: "admin" },
          ...invited.map((invitation) => ({ userId: user.id, organizationId: invitation.organizationId, role: invitation.role })),
        ],
        invitations: database.invitations.filter((invitation) => invitation.email !== user.email),
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
    /**
     * Nome, moeda padrão e cotação da empresa. Só quem a administra muda: a tela desabilita o
     * formulário para os outros, e esta é a regra.
     */
    updateOrganization(organizationId: string, draft: OrganizationDraft): Organization {
      const current = administeredOrganization(organizationId);
      const errors = validateOrganizationDraft(draft);
      if (Object.keys(errors).length > 0) throw new ValidationError<OrganizationDraft>(errors);
      return replaceOrganization({
        ...current,
        name: draft.name.trim(),
        defaultCurrency: draft.defaultCurrency,
        brlPerUsd: draft.brlPerUsd,
      });
    },

    /** Antecedência e canais de alerta da empresa. Mesma regra de papel dos dados da empresa. */
    updateAlertSettings(organizationId: string, draft: AlertSettings): Organization {
      const current = administeredOrganization(organizationId);
      const errors = validateAlertSettings(draft);
      if (Object.keys(errors).length > 0) throw new ValidationError<AlertSettings>(errors);
      return replaceOrganization({
        ...current,
        renewalLeadDays: draft.renewalLeadDays,
        alertChannels: { email: draft.alertChannels.email, whatsapp: draft.alertChannels.whatsapp },
      });
    },

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
        ...defaultAlertSettings(),
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
    /**
     * Convida alguém para a empresa. Nesta versão nada é enviado: quem já tem conta neste navegador
     * entra na hora; quem não tem fica com o convite pendente, aceito ao criar a conta com o e-mail.
     */
    inviteMember(
      organizationId: string,
      draft: InviteDraft,
    ): { kind: "added"; user: User } | { kind: "invited"; invitation: Invitation } {
      administeredOrganization(organizationId);
      const database = getDatabase();
      const email = normalizeEmail(draft.email);
      const errors = validateInviteDraft({ email, role: draft.role });
      const existing = database.users.find((user) => user.email === email);
      if (!errors.email) {
        if (existing && database.memberships.some((m) => m.userId === existing.id && m.organizationId === organizationId)) {
          errors.email = "Esta pessoa já faz parte da empresa.";
        } else if (database.invitations.some((i) => i.organizationId === organizationId && i.email === email)) {
          errors.email = "Já existe um convite para este e-mail.";
        }
      }
      if (Object.keys(errors).length > 0) throw new ValidationError<InviteDraft>(errors);
      if (existing) {
        commit({ ...database, memberships: [...database.memberships, { userId: existing.id, organizationId, role: draft.role }] });
        return { kind: "added", user: existing };
      }
      const invitation: Invitation = { id: newId(), organizationId, email, role: draft.role, invitedAt: today() };
      commit({ ...database, invitations: [...database.invitations, invitation] });
      return { kind: "invited", invitation };
    },

    revokeInvitation(invitationId: string): void {
      const invitation = getDatabase().invitations.find((candidate) => candidate.id === invitationId);
      if (!invitation) throw new Error("Convite não encontrado.");
      administeredOrganization(invitation.organizationId);
      const database = getDatabase();
      commit({ ...database, invitations: database.invitations.filter((candidate) => candidate.id !== invitationId) });
    },

    /**
     * Tira o acesso de alguém à empresa. Ninguém se remove por aqui — assim a empresa nunca fica sem
     * quem a administre.
     */
    removeMember(organizationId: string, userId: string): void {
      administeredOrganization(organizationId);
      const database = getDatabase();
      if (database.session?.userId === userId) throw new Error("Você não pode tirar o próprio acesso.");
      const memberships = database.memberships.filter((m) => !(m.userId === userId && m.organizationId === organizationId));
      if (memberships.length === database.memberships.length) throw new Error("Esta pessoa não faz parte da empresa.");
      commit({ ...database, memberships });
    },

    /** Dispensa um alerta da empresa. Dispensar de novo não muda nada. */
    dismissAlert(organizationId: string, key: string): void {
      const database = getDatabase();
      if (!database.organizations.some((organization) => organization.id === organizationId)) {
        throw new Error("Empresa não encontrada.");
      }
      if (!key.trim()) throw new Error("Alerta sem identificação.");
      if (database.dismissals.some((d) => d.organizationId === organizationId && d.key === key)) return;
      // ponytail: as dispensas se acumulam (uma linha curta por alerta tratado — anos cabem no
      // localStorage). Com o backend, viram tabela com limpeza das situações que já passaram.
      commit({ ...database, dismissals: [...database.dismissals, { organizationId, key, dismissedAt: today() }] });
    },

    /** Volta a mostrar um alerta dispensado (o "desfazer" e o "voltar a mostrar"). */
    restoreAlert(organizationId: string, key: string): void {
      const database = getDatabase();
      const dismissals = database.dismissals.filter((d) => !(d.organizationId === organizationId && d.key === key));
      if (dismissals.length !== database.dismissals.length) commit({ ...database, dismissals });
    },

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
    if (!valid) return null;
    // Campo que chegou depois da versão 2 entra com o padrão: o que já estava gravado continua valendo.
    const database = value as Database;
    return {
      ...database,
      organizations: database.organizations.map((organization) => ({ ...defaultAlertSettings(), ...organization })),
      dismissals: Array.isArray(value.dismissals) ? value.dismissals : [],
      invitations: Array.isArray(value.invitations) ? value.invitations : [],
    };
  } catch {
    return null;
  }
}
