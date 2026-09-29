import type { IsoDate, Organization, Subscription } from "@/lib/domain/types";
import { validateSubscriptionDraft, type FieldErrors, type SubscriptionDraft } from "@/lib/domain/validation";
import { createDemoData } from "./seed";

/** Chave versionada: formato novo ganha chave nova, e a antiga fica para a migração. */
export const STORAGE_KEY = "zerospend:v1";

/** Onde fica o conteúdo que não deu para ler — guardado, em vez de apagado. */
export const BACKUP_KEY = `${STORAGE_KEY}:backup`;

export interface Database {
  version: 1;
  organizations: Organization[];
  subscriptions: Subscription[];
}

/** O pedaço do `localStorage` que o repositório usa. Nos testes, um `Map` faz o papel. */
export type KeyValueStorage = Pick<Storage, "getItem" | "setItem">;

export class ValidationError extends Error {
  constructor(readonly fields: FieldErrors<SubscriptionDraft>) {
    super("Há campos inválidos na assinatura.");
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
    const demo: Database = { version: 1, ...createDemoData(today()) };
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

    /** Devolve a assinatura removida, para quem quiser oferecer "desfazer". */
    removeSubscription(id: string): Subscription {
      const removed = findSubscription(id);
      const database = getDatabase();
      commit({ ...database, subscriptions: database.subscriptions.filter((s) => s.id !== id) });
      return removed;
    },
  };
}

/** `randomUUID` só existe em contexto seguro (https ou localhost) — pelo IP da rede local, não. */
function newId(): string {
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
  };
}

function parse(raw: string): Database | null {
  try {
    const value = JSON.parse(raw) as Partial<Database> | null;
    const valid =
      value?.version === 1 && Array.isArray(value.organizations) && Array.isArray(value.subscriptions);
    return valid ? (value as Database) : null;
  } catch {
    return null;
  }
}
