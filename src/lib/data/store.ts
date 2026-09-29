import { useMemo, useSyncExternalStore } from "react";
import { toIsoDate } from "@/lib/domain/dates";
import type { Subscription } from "@/lib/domain/types";
import {
  createRepository,
  currentSession,
  STORAGE_KEY,
  type CurrentSession,
  type Database,
  type Repository,
} from "./repository";

let repository: Repository | undefined;

/** O repositório do navegador. Só existe no cliente: o servidor renderiza esqueleto. */
export function getRepository(): Repository {
  if (typeof window === "undefined") throw new Error("O repositório local só existe no navegador.");
  if (!repository) {
    const created = createRepository(window.localStorage, () => toIsoDate(new Date()));
    // Outra aba gravou (ou limpou) o armazenamento: relê.
    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEY || event.key === null) created.invalidate();
    });
    repository = created;
  }
  return repository;
}

const subscribe = (listener: () => void) => getRepository().subscribe(listener);
const getSnapshot = () => getRepository().getDatabase();
const getServerSnapshot = () => null;

/**
 * Os dados locais, para a tela. `null` no servidor e durante a hidratação — a tela mostra esqueleto,
 * e o HTML do servidor nunca diverge do primeiro render do cliente.
 */
export function useDatabase(): Database | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** A sessão resolvida (pessoa, empresa atual, papel). `null` sem sessão — e também no servidor. */
export function useSession(): CurrentSession | null {
  const database = useDatabase();
  return useMemo(() => (database ? currentSession(database) : null), [database]);
}

/** A empresa da sessão e as assinaturas dela — o que as telas do app mostram. `null` sem sessão. */
export function useOrganizationData(): { session: CurrentSession; subscriptions: Subscription[] } | null {
  const database = useDatabase();
  return useMemo(() => {
    const session = database ? currentSession(database) : null;
    if (!database || !session) return null;
    const subscriptions = database.subscriptions.filter((s) => s.organizationId === session.organization.id);
    return { session, subscriptions };
  }, [database]);
}
